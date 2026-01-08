// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  StoreInventory,
  StoreInventoryData,
  StoreInventoryPatch,
  StoreInventoryQuery,
  StoreInventoryService
} from './store-inventory.class'

export type { StoreInventory, StoreInventoryData, StoreInventoryPatch, StoreInventoryQuery }

export type StoreInventoryClientService = Pick<
  StoreInventoryService<Params<StoreInventoryQuery>>,
  (typeof storeInventoryMethods)[number]
>

export const storeInventoryPath = 'store-inventory'
export const productListPath = 'store-inventory/products'

export const storeInventoryMethods: Array<keyof StoreInventoryService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove',
  'update'
]

export const storeInventoryClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(storeInventoryPath, connection.service(storeInventoryPath), {
    methods: storeInventoryMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [storeInventoryPath]: StoreInventoryClientService
  }
}

export const getBatchesExpiryMoreThan90Days = (inventoryData: StoreInventoryData | any) => {
  const batches = []

  for (const batch of inventoryData?.batches ?? []) {
    const today = new Date()
    const expiryDate = new Date(batch.expiryDate)
    const daysDifference = (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)

    if (daysDifference > 90) {
      batches.push({ batchNo: batch.batchNo, expiryDate: batch.expiryDate })
    }
  }

  return batches
}
