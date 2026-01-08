// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  InventoryStock,
  InventoryStockData,
  InventoryStockPatch,
  InventoryStockQuery,
  InventoryStockService
} from './inventory-stock.class'

export type { InventoryStock, InventoryStockData, InventoryStockPatch, InventoryStockQuery }

export type InventoryStockClientService = Pick<
  InventoryStockService<Params<InventoryStockQuery>>,
  (typeof inventoryStockMethods)[number]
>

export const inventoryStockPath = 'inventory-stock'

export const inventoryStockMethods: Array<keyof InventoryStockService> = ['find']

export const inventoryStockClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(inventoryStockPath, connection.service(inventoryStockPath), {
    methods: inventoryStockMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [inventoryStockPath]: InventoryStockClientService
  }
}
