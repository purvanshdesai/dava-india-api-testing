// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../../client'
import type {
  SuperAdminUsersDeleteStore,
  SuperAdminUsersDeleteStoreData,
  SuperAdminUsersDeleteStorePatch,
  SuperAdminUsersDeleteStoreQuery,
  SuperAdminUsersDeleteStoreService
} from './delete-store.class'

export type {
  SuperAdminUsersDeleteStore,
  SuperAdminUsersDeleteStoreData,
  SuperAdminUsersDeleteStorePatch,
  SuperAdminUsersDeleteStoreQuery
}

export type SuperAdminUsersDeleteStoreClientService = Pick<
  SuperAdminUsersDeleteStoreService,
  (typeof superAdminUsersDeleteStoreMethods)[number]
>

export const superAdminUsersDeleteStorePath = 'super-admin-users/delete-store'

export const superAdminUsersDeleteStoreMethods: Array<keyof SuperAdminUsersDeleteStoreService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const superAdminUsersDeleteStoreClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(superAdminUsersDeleteStorePath, connection.service(superAdminUsersDeleteStorePath), {
    methods: superAdminUsersDeleteStoreMethods
  })
}

// Add this service to the client service type index
declare module '../../../client' {
  interface ServiceTypes {
    [superAdminUsersDeleteStorePath]: SuperAdminUsersDeleteStoreClientService
  }
}
