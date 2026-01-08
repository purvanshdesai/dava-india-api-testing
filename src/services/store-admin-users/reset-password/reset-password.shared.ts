// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../../client'
import type {
  StoreAdminUsersResetPassword,
  StoreAdminUsersResetPasswordData,
  StoreAdminUsersResetPasswordPatch,
  StoreAdminUsersResetPasswordQuery,
  StoreAdminUsersResetPasswordService
} from './reset-password.class'

export type {
  StoreAdminUsersResetPassword,
  StoreAdminUsersResetPasswordData,
  StoreAdminUsersResetPasswordPatch,
  StoreAdminUsersResetPasswordQuery
}

export const storeAdminUsersResetPasswordPath = 'store-admin-users/reset-password'

export const storeAdminUsersResetPasswordMethods: Array<keyof StoreAdminUsersResetPasswordService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]
