import { Types } from 'mongoose'
import { PREFIXES } from './prefixes'
import Redis from '../redis'
import { RolesModel } from '../../services/roles/roles.schema'
import { SuperAdminUsersModel } from '../../services/super-admin-users/super-admin-users.schema'
import { MODULES_PERMISSIONS } from '../../constants/permissions'
import { PermissionsModel } from '../../services/permissions/permissions.schema'
import { ModulesModel } from '../../services/modules/modules.schema'
import { TICKET_ISSUES } from '../../constants/general'
import { getRoleIdValueMapping } from '../../services/roles/roles.class'

const getObjectIdStr = <T extends string | string[] | Types.ObjectId | Types.ObjectId[]>(
  objectId: T
): T extends any[] ? string[] : string => {
  const getStringFromObjectId = (objId: string | Types.ObjectId): string => {
    if (objId instanceof Types.ObjectId) {
      return objId.toString()
    }
    return objId
  }

  if (Array.isArray(objectId)) {
    return objectId.map((oid) => getStringFromObjectId(oid)) as T extends any[] ? string[] : string
  } else {
    return getStringFromObjectId(objectId) as T extends any[] ? string[] : string
  }
}

export const hasUserFullAccess = async (userId: string | Types.ObjectId) => {
  const redis = Redis.getInstance()
  const cacheKey = PREFIXES.FULL_ACCESS_SUPER_ADMINS

  const userIdStr = getObjectIdStr(userId)

  const exist = await redis.exists(cacheKey)
  if (!exist) {
    const roles = await RolesModel.find({ fullAccess: true }).select('_id').lean()
    const superAdminUsers = await SuperAdminUsersModel.find({ role: { $in: roles.map((r) => r._id) } })
      .select('_id')
      .lean()
    const userIds = superAdminUsers.map((u) => u._id.toString())
    if (!userIds.length) return false

    await redis.sadd(cacheKey, userIds)
  }

  return (await redis.sismember(cacheKey, userIdStr)) > 0
}

export const manageUserFullAccess = async (userId: string | Types.ObjectId, operation: 'add' | 'remove') => {
  // if (!(await hasUserFullAccess(userId))) return

  const userIdStr = getObjectIdStr(userId)

  const redis = Redis.getInstance()
  const cacheKey = PREFIXES.FULL_ACCESS_SUPER_ADMINS

  if (operation === 'add') return redis.sadd(cacheKey, userIdStr)
  else return redis.srem(cacheKey, userIdStr)
}

const getPermissionFromIssueType = (issueType: string) => {
  switch (issueType) {
    case TICKET_ISSUES.ORDER_NOT_DELIVERED:
      return MODULES_PERMISSIONS.TICKET_MANAGEMENT.permissions.ORDER_NOT_DELIVERED
    case TICKET_ISSUES.LATE_DELIVERY:
      return MODULES_PERMISSIONS.TICKET_MANAGEMENT.permissions.LATE_DELIVERY
    case TICKET_ISSUES.WRONG_MEDICINE_DELIVERED:
      return MODULES_PERMISSIONS.TICKET_MANAGEMENT.permissions.WRONG_MEDICINE_DELIVERED
    case TICKET_ISSUES.ORDER_CANCELLATION_REQUEST:
      return MODULES_PERMISSIONS.TICKET_MANAGEMENT.permissions.ORDER_NOT_DELIVERED // TODO change this
    case TICKET_ISSUES.LOST_OR_MISSING_ITEM:
      return MODULES_PERMISSIONS.TICKET_MANAGEMENT.permissions.LOST_OR_MISSING_ITEMS_IN_DELIVERY
    case TICKET_ISSUES.PRESCRIPTION_UPLOAD:
      return MODULES_PERMISSIONS.TICKET_MANAGEMENT.permissions.PRESCRIPTION_UPLOAD
    case TICKET_ISSUES.DOCTOR_CONSULTATION:
      return MODULES_PERMISSIONS.TICKET_MANAGEMENT.permissions.DOCTOR_CONSULTATION
    default:
      return MODULES_PERMISSIONS.TICKET_MANAGEMENT.permissions.SUPPORT_TICKET_FULL_ACCESS
  }
}

export const checkSupportTicketAccess = async (userId: string | Types.ObjectId, issueType?: string) => {
  const redis = Redis.getInstance()

  const permission = getPermissionFromIssueType(issueType ?? '')
  const cacheKey = `${PREFIXES.SUPPORT_TICKET}${permission}`

  const userIdStr = getObjectIdStr(userId)

  const exist = await redis.exists(cacheKey)
  if (!exist) {
    const module = MODULES_PERMISSIONS.TICKET_MANAGEMENT.key
    const permissions = [permission] // TODO add support ticket full access permission value
    const permissionsDocs = await PermissionsModel.find({ key: { $in: permissions } })
    const moduleDoc = await ModulesModel.findOne({ key: module })

    const userIds: string[] = []
    if (moduleDoc && permissionsDocs.length) {
      const roles = await RolesModel.find({
        modules: {
          $elemMatch: {
            moduleId: moduleDoc._id,
            permissions: { $all: permissionsDocs.map((p: any) => p._id) }
          }
        }
      })

      const supportUsers = await SuperAdminUsersModel.find({ role: { $in: roles.map((r: any) => r._id) } })
        .select('_id')
        .lean()
      userIds.push(...supportUsers.map((u) => u._id.toString()))
    }
    if (!userIds.length) return false

    await redis.sadd(cacheKey, userIds)
  }
  return (await redis.sismember(cacheKey, userIdStr)) > 0
}

export const hasSupportTicketAccess = async (userId: string | Types.ObjectId, issueType?: string) => {
  const hasFullAccess = await checkSupportTicketAccess(userId, '')
  if (hasFullAccess) return true

  return checkSupportTicketAccess(userId, issueType)
}

export const manageSupportTicketAccess = async ({
  userId,
  permissionKey,
  issueType,
  operation
}: {
  userId: string | string[] | Types.ObjectId | Types.ObjectId[]
  issueType?: string
  permissionKey?: string
  operation: 'add' | 'remove'
}) => {
  if (!permissionKey && !issueType) throw new Error('Either permission or issue is required')

  // if (!(await hasSupportTicketAccess(userId, issueType))) return

  const userIdStr = Array.isArray(userId) ? getObjectIdStr(userId) : [getObjectIdStr(userId)]

  const redis = Redis.getInstance()

  const permission = permissionKey ? permissionKey : issueType ? getPermissionFromIssueType(issueType) : ''
  if (!permission) throw new Error('Permission name provided')

  const cacheKey = `${PREFIXES.SUPPORT_TICKET}${permission}`

  if (operation === 'add') return redis.sadd(cacheKey, userIdStr)
  else return redis.srem(cacheKey, userIdStr)
}

export const clearSupportTicketPermissionCache = async (permissionKey?: string) => {
  const redis = Redis.getInstance()

  if (permissionKey) {
    // Clear specific permission cache
    const cacheKey = `${PREFIXES.SUPPORT_TICKET}${permissionKey}`
    await redis.del(cacheKey)
  } else {
    // Clear all support ticket permission caches
    const keys = await redis.keys(`${PREFIXES.SUPPORT_TICKET}*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }
}

export const getUsersWithSupportTicketPermission = async (issueType: string) => {
  const redis = Redis.getInstance()

  const permission = getPermissionFromIssueType(issueType)
  const cacheKey = `${PREFIXES.SUPPORT_TICKET}${permission}`

  const exist = await redis.exists(cacheKey)
  if (!exist) {
    const module = MODULES_PERMISSIONS.TICKET_MANAGEMENT.key
    const permissions = [permission] // TODO add support ticket full access permission value
    const permissionsDocs = await PermissionsModel.find({ key: { $in: permissions } })
    const moduleDoc = await ModulesModel.findOne({ key: module })

    const userIds: string[] = []
    if (moduleDoc && permissionsDocs.length) {
      const roles = await RolesModel.find({
        modules: {
          $elemMatch: {
            moduleId: moduleDoc._id,
            permissions: { $all: permissionsDocs.map((p: any) => p._id) }
          }
        }
      })

      const supportUsers = await SuperAdminUsersModel.find({ role: { $in: roles.map((r: any) => r._id) } })
        .select('_id')
        .lean()
      userIds.push(...supportUsers.map((u) => u._id.toString()))

      await redis.sadd(cacheKey, userIds)
    }
  }
  return redis.smembers(cacheKey)
}

// TODO as per role permission add or remove given users
export const manageTicketPermissionsFromRole = async ({
  userIds,
  roleId,
  operation
}: {
  userIds: string[] | Types.ObjectId[]
  roleId: string | Types.ObjectId
  operation: 'add' | 'remove'
}) => {
  const redis = Redis.getInstance()

  const userIdsStr = getObjectIdStr(userIds)
  const roleIdStr = getObjectIdStr(roleId)

  const role = await RolesModel.findById(roleId).lean()
  if (!role) throw new Error('Role not found')

  const ticketModule = await ModulesModel.findOne({ key: MODULES_PERMISSIONS.TICKET_MANAGEMENT.key }).lean()

  const roleTicketModule = role.modules.find((m) => m.moduleId.toString() === ticketModule?._id.toString())
  if (!roleTicketModule) throw new Error('Ticket module is not permitted in this role')

  const [roleMappedValues] = await getRoleIdValueMapping([role])
  const roleTicketModuleValues = roleMappedValues.modules.find(
    (m: any) => m.moduleId === MODULES_PERMISSIONS.TICKET_MANAGEMENT.key
  )
  if (!roleTicketModuleValues) throw new Error('Ticket module is not permitted in this role')

  const givenPermissions = roleTicketModuleValues.permissionValues
  for (const permission of givenPermissions) {
    const cacheKey = `${PREFIXES.SUPPORT_TICKET}${permission.key}`
    const exist = await redis.exists(cacheKey)

    if (!exist) {
      const roles = await RolesModel.find({
        modules: {
          $elemMatch: {
            moduleId: new Types.ObjectId(ticketModule?._id),
            permissions: { $all: [new Types.ObjectId(permission._id)] }
          }
        }
      })
      const supportUsers = await SuperAdminUsersModel.find({
        role: { $in: roles.map((r: any) => r._id) },
        $or: [
          { archive: false }, // Matches if isActive is explicitly false
          { archive: { $exists: false } } // Matches if isActive does not exist
        ]
      })
        .select('_id')
        .lean()
      await redis.sadd(
        cacheKey,
        supportUsers.map((u) => u._id.toString())
      )
    }

    if (operation === 'add') redis.sadd(cacheKey, userIdsStr)
    else redis.srem(cacheKey, userIdsStr)
  }
}
