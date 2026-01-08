// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  SuperAdminUsersModel,
  type SuperAdminUsers,
  type SuperAdminUsersData,
  type SuperAdminUsersPatch,
  type SuperAdminUsersQuery
} from './super-admin-users.schema'
import { BadRequest, NotFound } from '@feathersjs/errors'
import { manageTicketPermissionsFromRole, manageUserFullAccess } from '../../cache/redis/permissions'
import { RolesModel } from '../roles/roles.schema'
import { UserInvitationModel, userInvitations } from '../user-invitations/user-invitations'

export type { SuperAdminUsers, SuperAdminUsersData, SuperAdminUsersPatch, SuperAdminUsersQuery }

export interface SuperAdminUsersParams extends MongoDBAdapterParams<SuperAdminUsersQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class SuperAdminUsersService<
  ServiceParams extends Params = SuperAdminUsersParams
> extends MongoDBService<SuperAdminUsers, SuperAdminUsersData, SuperAdminUsersParams, SuperAdminUsersPatch> {
  async find(params?: any | undefined): Promise<any> {
    try {
      const query: any = params?.query
      const { $limit = 0, $skip = 0, ...filters } = query || {}

      // Filters for SuperAdminUsersModel
      const archiveFilter = {
        $or: [{ archive: false }, { archive: { $exists: false } }, { archive: null }]
      }
      const combinedFilters = { ...filters, ...archiveFilter }

      // Fetch users from SuperAdminUsersModel
      const users = await SuperAdminUsersModel.find(combinedFilters)
        .populate('role')
        .limit($limit)
        .skip($skip)
        .lean()
      const totalDocs = await SuperAdminUsersModel.countDocuments(combinedFilters)

      // Merge users from both sources
      const combinedData = [
        ...users.map((u: any) => ({
          ...u,
          roleName: u?.role?.roleName || null,
          source: 'users' // Optional: identify the source
        }))
      ]

      return {
        data: combinedData,
        total: totalDocs // Adjust total to include invited users
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async patch(id: any, data: any, params: any): Promise<any> {
    try {
      const userExist = await SuperAdminUsersModel.findById(id).lean()
      if (!userExist) {
        throw new BadRequest('User not found')
      }

      const updatedUser = await SuperAdminUsersModel.findByIdAndUpdate(id, { ...data })

      // TODO if full access toggle is changed then remove user from permissions cache and add in full access cache and vice versa
      const role = await RolesModel.findById(userExist.role).lean()
      if (!role) throw new BadRequest('Role not found')

      if (
        data.hasOwnProperty('isActive') ||
        (data.role && data.role.toString() !== userExist.role.toString())
      ) {
        try {
          if (role.fullAccess) await manageUserFullAccess(userExist._id, 'remove')
          else
            await manageTicketPermissionsFromRole({
              userIds: id,
              roleId: userExist.role.toString(),
              operation: 'remove'
            })
        } catch (err) {}

        try {
          if (
            (data.hasOwnProperty('isActive') && data.isActive) ||
            (!data.hasOwnProperty('isActive') && userExist.isActive)
          ) {
            if (role.fullAccess) await manageUserFullAccess(userExist._id, 'add')
            else
              await manageTicketPermissionsFromRole({
                userIds: id,
                roleId: data.role.toString(),
                operation: 'add'
              })
          }
        } catch (err) {}
      }

      return updatedUser
    } catch (error) {
      throw error
    }
  }

  // Delete (soft delete) method that sets archive field to true
  async remove(id: any): Promise<any> {
    try {
      const user = await SuperAdminUsersModel.findById(id).lean()

      if (!user) {
        throw new NotFound('User not found')
      }
      let updatedUser: any = {}

      if (user.archive === undefined || user.archive === null) {
        updatedUser = await SuperAdminUsersModel.findByIdAndUpdate(
          id,
          { $set: { archive: true } },
          { new: true }
        )
      } else {
        updatedUser = await SuperAdminUsersModel.findByIdAndUpdate(id, {
          $set: { archive: true }
        })
      }

      if (!updatedUser) {
        throw new NotFound('User not found')
      }

      // TODO remove user from permission cache
      const role = await RolesModel.findById(user.role).lean()
      if (!role) throw new BadRequest('Role not found')
      try {
        if (role.fullAccess) await manageUserFullAccess(user._id, 'remove')
        else
          await manageTicketPermissionsFromRole({
            userIds: id,
            roleId: user.role.toString(),
            operation: 'remove'
          })
      } catch (err) {}

      return updatedUser
    } catch (error) {
      throw error
    }
  }
}

export class InvitedSuperAdminUsersService<
  ServiceParams extends Params = SuperAdminUsersParams
> extends MongoDBService<SuperAdminUsers, SuperAdminUsersData, SuperAdminUsersParams, SuperAdminUsersPatch> {
  async find(params?: any | undefined): Promise<any> {
    try {
      const query: any = params?.query
      const { $limit = 0, $skip = 0 } = query || {}
      const filter = { status: 'invited' }

      // Fetch users from SuperAdminUsersModel
      const invitations = await UserInvitationModel.find(filter)
        .populate('role')
        .limit($limit)
        .skip($skip)
        .lean()

      const totalDocs = await UserInvitationModel.countDocuments(filter)

      // Merge users from both sources
      const combinedData = [
        ...invitations.map((u: any) => ({
          ...u,
          roleName: u?.role?.roleName || null,
          source: 'users' // Optional: identify the source
        }))
      ]

      return { data: combinedData, total: totalDocs }
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('super-admin-users'))
  }
}
