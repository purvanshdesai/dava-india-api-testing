// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../../client'
import type {
  StoreAdminUsersChangeStore,
  StoreAdminUsersChangeStoreData,
  StoreAdminUsersChangeStorePatch,
  StoreAdminUsersChangeStoreQuery,
  StoreAdminUsersChangeStoreService
} from './change-store.class'

export type {
  StoreAdminUsersChangeStore,
  StoreAdminUsersChangeStoreData,
  StoreAdminUsersChangeStorePatch,
  StoreAdminUsersChangeStoreQuery
}

export const storeAdminUsersChangeStorePath = 'store-admin-users/change-store'
export const storeAdminUsersPartialTransferPath = 'store-admin-users/partial-transfer'

export const storeAdminUsersChangeStoreMethods: Array<keyof StoreAdminUsersChangeStoreService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]
