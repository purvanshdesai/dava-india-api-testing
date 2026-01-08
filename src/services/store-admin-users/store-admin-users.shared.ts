// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  StoreAdminUsers,
  StoreAdminUsersData,
  StoreAdminUsersPatch,
  StoreAdminUsersQuery,
  StoreAdminUsersService
} from './store-admin-users.class'

export type { StoreAdminUsers, StoreAdminUsersData, StoreAdminUsersPatch, StoreAdminUsersQuery }

export type StoreAdminUsersClientService = Pick<
  StoreAdminUsersService<Params<StoreAdminUsersQuery>>,
  (typeof storeAdminUsersMethods)[number]
>

export const storeAdminUsersPath = 'store-admin-users'

export const storeAdminUsersMethods: Array<keyof StoreAdminUsersService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const storeAdminUsersClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(storeAdminUsersPath, connection.service(storeAdminUsersPath), {
    methods: storeAdminUsersMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [storeAdminUsersPath]: StoreAdminUsersClientService
  }
}
