// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  inventoryStockDataValidator,
  inventoryStockPatchValidator,
  inventoryStockQueryValidator,
  inventoryStockResolver,
  inventoryStockExternalResolver,
  inventoryStockDataResolver,
  inventoryStockPatchResolver,
  inventoryStockQueryResolver
} from './inventory-stock.schema'

import type { Application } from '../../declarations'
import { InventoryStockService, getOptions } from './inventory-stock.class'
import { inventoryStockPath, inventoryStockMethods } from './inventory-stock.shared'

export * from './inventory-stock.class'
export * from './inventory-stock.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const inventoryStock = (app: Application) => {
  // Register our service on the Feathers application
  app.use(inventoryStockPath, new InventoryStockService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: inventoryStockMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(inventoryStockPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'store-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(inventoryStockExternalResolver),
        schemaHooks.resolveResult(inventoryStockResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(inventoryStockQueryValidator),
        schemaHooks.resolveQuery(inventoryStockQueryResolver)
      ],
      find: []
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [inventoryStockPath]: InventoryStockService
  }
}
