// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  StoreActivity,
  StoreActivityData,
  StoreActivityPatch,
  StoreActivityQuery,
  StoreActivityService
} from './store-activity.class'

export type { StoreActivity, StoreActivityData, StoreActivityPatch, StoreActivityQuery }

export type StoreActivityClientService = Pick<
  StoreActivityService<Params<StoreActivityQuery>>,
  (typeof storeActivityMethods)[number]
>

export const storeActivityPath = '/store/order/:orderId/activity'
export const orderSyncActivityPath = '/store/order/:orderId/sync'

export const storeActivityMethods: Array<keyof StoreActivityService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const storeActivityClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(storeActivityPath, connection.service(storeActivityPath), {
    methods: storeActivityMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [storeActivityPath]: StoreActivityClientService
  }
}
