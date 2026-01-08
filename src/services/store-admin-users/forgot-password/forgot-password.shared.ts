// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../../client'
import type {
  StoreAdminUsersForgotPassword,
  StoreAdminUsersForgotPasswordData,
  StoreAdminUsersForgotPasswordPatch,
  StoreAdminUsersForgotPasswordQuery,
  StoreAdminUsersForgotPasswordService
} from './forgot-password.class'

export type {
  StoreAdminUsersForgotPassword,
  StoreAdminUsersForgotPasswordData,
  StoreAdminUsersForgotPasswordPatch,
  StoreAdminUsersForgotPasswordQuery
}

export type StoreAdminUsersForgotPasswordClientService = Pick<
  StoreAdminUsersForgotPasswordService,
  (typeof storeAdminUsersForgotPasswordMethods)[number]
>

export const storeAdminUsersForgotPasswordPath = 'store-admin-users/forgot-password'

export const storeAdminUsersForgotPasswordMethods: Array<keyof StoreAdminUsersForgotPasswordService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const storeAdminUsersForgotPasswordClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(storeAdminUsersForgotPasswordPath, connection.service(storeAdminUsersForgotPasswordPath), {
    methods: storeAdminUsersForgotPasswordMethods
  })
}

// Add this service to the client service type index
declare module '../../../client' {
  interface ServiceTypes {
    [storeAdminUsersForgotPasswordPath]: StoreAdminUsersForgotPasswordClientService
  }
}
