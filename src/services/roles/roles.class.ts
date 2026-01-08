// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  RolesModel,
  type Roles,
  type RolesData,
  type RolesPatch,
  type RolesQuery,
  RolesDbType
} from './roles.schema'
import { BadRequest } from '@feathersjs/errors'
import { PermissionsModel } from '../permissions/permissions.schema'
import { all } from 'axios'
import { ModulesModel } from '../modules/modules.schema'
import {
  manageSupportTicketAccess,
  manageTicketPermissionsFromRole,
  manageUserFullAccess,
  clearSupportTicketPermissionCache
} from '../../cache/redis/permissions'
import { MODULES_PERMISSIONS } from '../../constants/permissions'
import { SuperAdminUsersModel } from '../super-admin-users/super-admin-users.schema'

export type { Roles, RolesData, RolesPatch, RolesQuery }

export interface RolesParams extends MongoDBAdapterParams<RolesQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class RolesService<ServiceParams extends Params = RolesParams> extends MongoDBService<
  Roles,
  RolesData,
  RolesParams,
  RolesPatch
> {
  async find(params?: RolesParams): Promise<any> {
    try {
      const { query }: any = params || {}
      const { $limit = 0, $skip = 0, noPagination = false, ...filters } = query || {}
      const roles = await RolesModel.find(filters)
        .populate('modules.moduleId')
        .limit(noPagination ? 1000 : $limit)
        .skip($skip)
        .lean()
      const totalDocs = await RolesModel.countDocuments(filters)
      return { data: roles, total: totalDocs }
    } catch (error) {
      throw error
    }
  }

  async get(id: any): Promise<any> {
    try {
      const role = await RolesModel.findById(id).lean()
      if (!role) {
        throw new BadRequest('Role not found')
      }

      return role
    } catch (error) {
      throw error
    }
  }

  async create(data: any, params?: RolesParams): Promise<any> {
    try {
      const role = await super.create(data)
      return role
    } catch (error) {
      throw error
    }
  }

  async patch(id: any, data: any, params: any): Promise<any> {
    try {
      const oldRole = await RolesModel.findById(id).lean()
      if (!oldRole) {
        throw new BadRequest('Role not found')
      }

      const updatedRole = await RolesModel.findByIdAndUpdate(id, { ...data }, { returnDocument: 'after' })
      if (!updatedRole) return
      const updatedRoleObject = updatedRole.toObject()

      const isFullAccessGiven = !oldRole.fullAccess && updatedRoleObject.fullAccess
      const isFullAccessRemoved = oldRole.fullAccess && !updatedRoleObject.fullAccess

      const roleUsers = await SuperAdminUsersModel.find({
        role: oldRole._id,
        $or: [
          { archive: false }, // Matches if isActive is explicitly false
          { archive: { $exists: false } } // Matches if isActive does not exist
        ]
      })
        .select('_id')
        .lean()
      const roleUserIds = roleUsers.map((u) => u._id.toString())

      const manageTicketPermissionFromRolePayload = async (
        rolePayload: RolesDbType,
        operation: 'add' | 'remove'
      ) => {
        const [valueMappedRole] = await getRoleIdValueMapping([rolePayload])
        // remove from ticket permissions
        const ticketModule = valueMappedRole.modules.find(
          (m) => m.moduleId === MODULES_PERMISSIONS.TICKET_MANAGEMENT.key
        )
        if (ticketModule) {
          for (const permission of ticketModule?.permissionValues.map((p) => p.key)) {
            await manageSupportTicketAccess({
              userId: roleUserIds,
              permissionKey: permission,
              operation: operation
            })
          }
        }
      }

      if (isFullAccessGiven) {
        // case 3: full access given
        await manageTicketPermissionFromRolePayload(oldRole, 'remove')
        for (const userId of roleUserIds) {
          // add to full access permission cache
          await manageUserFullAccess(userId, 'add')
        }
      } else if (isFullAccessRemoved) {
        // case 4: full access removed
        for (const userId of roleUserIds) {
          // remove from full access permission
          await manageUserFullAccess(userId, 'remove')
        }
        // add to ticket permission cache
        await manageTicketPermissionFromRolePayload(oldRole, 'add')
      } else {
        const isFullAccess = oldRole.fullAccess
        if (isFullAccess) {
          // case 1: has full access
          // case 5: active/inactive toggle changed
          const isRoleSetInactive = oldRole.active && !updatedRole.active
          const isRoleSetActive = !oldRole.active && updatedRole.active
          if (isRoleSetActive || isRoleSetInactive) {
            for (const userId of roleUserIds) {
              // remove from full access permission
              await manageUserFullAccess(userId, isRoleSetActive ? 'add' : 'remove')
            }
          }
        } else {
          // case 2: does not has full access
          // calculate difference and update permissions cache
          const valueMappedRoles = await getRoleIdValueMapping([oldRole, updatedRole.toObject()])
          const diff = getChangedPermissions(valueMappedRoles[0], valueMappedRoles[1])

          const ticketModuleChanges = diff.modules.find(
            (m) => m.moduleId === MODULES_PERMISSIONS.TICKET_MANAGEMENT.key
          )
          if (ticketModuleChanges) {
            const { added, removed } = ticketModuleChanges
            if (added.length || removed.length) {
              // Clear affected permission caches to ensure fresh data
              for (const perm of [...added, ...removed]) {
                await clearSupportTicketPermissionCache(perm)
              }

              const roleUsers = await SuperAdminUsersModel.find({
                role: oldRole._id,
                $or: [
                  { archive: false }, // Matches if isActive is explicitly false
                  { archive: { $exists: false } } // Matches if isActive does not exist
                ]
              })
                .select('_id')
                .lean()
              for (const user of roleUsers) {
                for (const perm of added) {
                  await manageSupportTicketAccess({ userId: user._id, permissionKey: perm, operation: 'add' })
                }
                for (const perm of removed) {
                  await manageSupportTicketAccess({
                    userId: user._id,
                    permissionKey: perm,
                    operation: 'remove'
                  })
                }
              }
            }
          }
        }
      }

      return updatedRole
    } catch (error) {
      throw error
    }
  }

  async remove(id: any): Promise<any> {
    try {
      const role = await RolesModel.findById(id).lean()

      if (!role) throw new BadRequest('Role not found')

      await RolesModel.findByIdAndDelete(id)

      if (role.fullAccess) {
        const roleUsers = await SuperAdminUsersModel.find({
          role: role._id,
          $or: [
            { archive: false }, // Matches if isActive is explicitly false
            { archive: { $exists: false } } // Matches if isActive does not exist
          ]
        })
          .select('_id')
          .lean()
        const roleUserIds = roleUsers.map((u) => u._id.toString())
        for (const userId of roleUserIds) {
          await manageUserFullAccess(userId, 'remove')
        }
      } else {
        const ticketModule = await ModulesModel.findOne({
          key: MODULES_PERMISSIONS.TICKET_MANAGEMENT.key
        }).lean()
        const roleTicketModule = role.modules.find(
          (m) => m.moduleId.toString() === ticketModule?._id.toString()
        )

        if (roleTicketModule) {
          const ticketModulePermissions = await PermissionsModel.find({
            _id: { $in: roleTicketModule?.permissions }
          }).lean()

          // Clear affected permission caches
          for (const permission of ticketModulePermissions) {
            await clearSupportTicketPermissionCache(permission.key)
          }

          const roleUsers = await SuperAdminUsersModel.find({
            role: role._id,
            $or: [
              { archive: false }, // Matches if isActive is explicitly false
              { archive: { $exists: false } } // Matches if isActive does not exist
            ]
          })
            .select('_id')
            .lean()
          for (const user of roleUsers) {
            for (const permission of ticketModulePermissions) {
              await manageSupportTicketAccess({
                userId: user._id,
                permissionKey: permission.key,
                operation: 'remove'
              })
            }
          }
        }
      }

      return role
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('roles'))
  }
}

const getChangedPermissions = (oldPayload: MappedRole, newPayload: MappedRole) => {
  const result: { modules: { moduleId: string; added: string[]; removed: string[] }[] } = { modules: [] }

  // TODO if full access toggle is changed then remove user from permissions cache and add in full access cache and vice versa
  // Convert modules in oldPayload to a map for quick lookup
  const oldModulesMap = new Map<string, Set<string>>()
  oldPayload.modules.forEach((module) => {
    oldModulesMap.set(module.moduleId, new Set<string>(module.permissionValues.map((pv: any) => pv.key)))
  })

  const isRoleSetInactive = oldPayload.active && !newPayload.active
  const isRoleSetActive = !oldPayload.active && newPayload.active

  if (isRoleSetInactive || isRoleSetActive) {
    oldPayload.modules.forEach((module) => {
      result.modules.push({
        moduleId: module.moduleId,
        added: isRoleSetActive ? module.permissionValues.map((pv) => pv.key) : [],
        removed: isRoleSetInactive ? module.permissionValues.map((pv) => pv.key) : []
      })
    })

    return result
  }

  // Process newPayload modules
  newPayload.modules.forEach((newModule: any) => {
    const { moduleId, permissionValues: newPermissions } = newModule
    const oldPermissions = oldModulesMap.get(moduleId) || new Set<string>()
    const newPermissionsSet = new Set<string>(newPermissions.map((np: any) => np.key))

    // Determine added and removed permissions
    const added = [...newPermissionsSet].filter((perm) => !oldPermissions.has(perm))
    const removed = [...oldPermissions].filter((perm) => !newPermissionsSet.has(perm))

    // Add to result if there are any changes
    result.modules.push({
      moduleId,
      added,
      removed
    })
  })

  const newPayloadModules = newPayload.modules.map((m: any) => m.moduleId)
  const removedModules = oldPayload.modules.filter((m: any) => !newPayloadModules.includes(m.moduleId))

  removedModules.forEach((removedModule: any) => {
    result.modules.push({
      moduleId: removedModule.moduleId,
      added: [],
      removed: removedModule.permissionValues.map((pv: any) => pv.key)
    })
  })

  return result
}

const updateUsersWithPermission = async ({ oldRole, newRole }: { oldRole: any; newRole: any }) => {}

// Define the new shape of module data after mapping
interface MappedModule {
  _id: string // The module's ID as a string
  moduleId: string // The key of the module
  sectionName: string // The name of the section
  permissions: string[] // Original permission IDs
  permissionValues: { _id: string; key: string }[] // Mapped permission key values
}

// Extend RolesDbType to include the modified modules
interface MappedRole extends RolesDbType {
  modules: MappedModule[]
}

export const getRoleIdValueMapping = async (roles: RolesDbType[]): Promise<MappedRole[]> => {
  const allModules = await ModulesModel.find().select('_id key sectionName').lean()
  const idWiseModule = allModules.reduce((acc: any, curr) => {
    acc[curr._id.toString()] = {
      _id: curr._id.toString(),
      key: curr.key,
      sectionName: curr.sectionName
    }
    return acc
  }, {})

  const allPermissions = await PermissionsModel.find().select('_id key').lean()
  const idWisePermission = allPermissions.reduce((acc: any, curr) => {
    acc[curr._id.toString()] = curr.key
    return acc
  }, {})

  const mapIdToValue = (m: any) => {
    const { moduleId, permissions: permissionIds } = m
    const module = idWiseModule[moduleId]
    const permissions = permissionIds.map((p: any) => ({ _id: p, key: idWisePermission[p] }))

    return {
      _id: module._id,
      moduleId: module.key,
      sectionName: module.sectionName,
      permissions: permissionIds,
      permissionValues: permissions
    }
  }

  return roles.map((role: any) => {
    const { modules } = role
    const valueMappedModules = modules.map((m: any) => mapIdToValue(m))
    return {
      ...role,
      modules: valueMappedModules
    }
  })
}
