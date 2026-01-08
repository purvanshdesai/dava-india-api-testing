// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../../client'
import type {
  SuperAdminUserForgotPassword,
  SuperAdminUserForgotPasswordData,
  SuperAdminUserForgotPasswordPatch,
  SuperAdminUserForgotPasswordQuery,
  SuperAdminUserForgotPasswordService
} from './forgot-password.class'

export type {
  SuperAdminUserForgotPassword,
  SuperAdminUserForgotPasswordData,
  SuperAdminUserForgotPasswordPatch,
  SuperAdminUserForgotPasswordQuery
}

export type SuperAdminUserForgotPasswordClientService = Pick<
  SuperAdminUserForgotPasswordService,
  (typeof superAdminUserForgotPasswordMethods)[number]
>

export const superAdminUserForgotPasswordPath = 'super-admin-users/forgot-password'

export const superAdminUserForgotPasswordMethods: Array<keyof SuperAdminUserForgotPasswordService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const superAdminUserForgotPasswordClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(superAdminUserForgotPasswordPath, connection.service(superAdminUserForgotPasswordPath), {
    methods: superAdminUserForgotPasswordMethods
  })
}

// Add this service to the client service type index
declare module '../../../client' {
  interface ServiceTypes {
    [superAdminUserForgotPasswordPath]: SuperAdminUserForgotPasswordClientService
  }
}
