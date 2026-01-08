// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import Inventory from './routeConfig/inventory'
import ProductList from './routeConfig/productList'

import type { Application } from '../../declarations'
import { StoreInventoryService, getOptions, ProductListForInventoryService } from './store-inventory.class'
import { storeInventoryPath, storeInventoryMethods, productListPath } from './store-inventory.shared'

export * from './store-inventory.class'
export * from './store-inventory.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const storeInventory = (app: Application) => {
  Inventory(app)
  ProductList(app)
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [storeInventoryPath]: StoreInventoryService
    [productListPath]: ProductListForInventoryService
  }
}
