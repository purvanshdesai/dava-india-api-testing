// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../../client'
import {
  StoreAdminAddProductBatchNoService,
  StoreAdminUsersOrders,
  StoreAdminUsersOrdersData,
  StoreAdminUsersOrdersPatch,
  StoreAdminUsersOrdersQuery,
  StoreAdminUsersOrdersService
} from './orders.class'

export type {
  StoreAdminUsersOrders,
  StoreAdminUsersOrdersData,
  StoreAdminUsersOrdersPatch,
  StoreAdminUsersOrdersQuery
}

export const storeAdminUsersOrdersPath = 'store-admin-users/orders'
export const storeAdminAddProductBatchNoPath = 'store-admin-users/orders/:orderId/products/batches'

export const storeAdminUsersOrdersMethods: Array<keyof StoreAdminUsersOrdersService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]
export const storeAdminAddProductBatchNoMethods: Array<keyof StoreAdminAddProductBatchNoService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]
