import { Application } from '../../../declarations'
import { storeInventoryMethods, productListPath } from '../store-inventory.shared'
import { getOptions, ProductListForInventoryService } from '../store-inventory.class'
import { hooks as schemaHooks } from '@feathersjs/schema'
import {
  storeInventoryDataResolver,
  storeInventoryDataValidator,
  storeInventoryExternalResolver,
  storeInventoryPatchResolver,
  storeInventoryPatchValidator,
  storeInventoryQueryResolver,
  storeInventoryQueryValidator,
  storeInventoryResolver
} from '../store-inventory.schema'
import { authenticate } from '@feathersjs/authentication'
export default function Inventory(app: Application) {
  // Register our service on the Feathers application
  app.use(productListPath, new ProductListForInventoryService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['find'],
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(productListPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'store-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(storeInventoryExternalResolver),
        schemaHooks.resolveResult(storeInventoryResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(storeInventoryQueryValidator),
        schemaHooks.resolveQuery(storeInventoryQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(storeInventoryDataValidator),
        schemaHooks.resolveData(storeInventoryDataResolver)
      ],
      patch: [
        schemaHooks.validateData(storeInventoryPatchValidator),
        schemaHooks.resolveData(storeInventoryPatchResolver)
      ],
      remove: []
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}
