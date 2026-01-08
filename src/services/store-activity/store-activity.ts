// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import type { Application } from '../../declarations'
import { getOptions, StoreActivityService, OrderActivitySyncService } from './store-activity.class'
import { storeActivityMethods, storeActivityPath, orderSyncActivityPath } from './store-activity.shared'
import { hooks as schemaHooks } from '@feathersjs/schema'
import {
  storeActivityDataValidator,
  storeActivityPatchValidator,
  storeActivityQueryValidator,
  storeActivityResolver,
  storeActivityExternalResolver,
  storeActivityDataResolver,
  storeActivityPatchResolver,
  storeActivityQueryResolver
} from './store-activity.schema'
export * from './store-activity.class'
export * from './store-activity.schema'
import { authenticateHook } from '../../utils'

// A configure function that registers the service and its hooks via `app.configure`
export const storeActivity = (app: Application) => {
  // Register our service on the Feathers application
  app.use(storeActivityPath, new StoreActivityService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: storeActivityMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })

  app.use(orderSyncActivityPath, new OrderActivitySyncService(), {
    // A list of all methods this service exposes externally
    methods: ['create'],
    // You can add additional custom events to be sent to clients here
    events: []
  })

  // Initialize hooks
  app.service(storeActivityPath).hooks({
    around: {
      all: [
        authenticateHook,
        schemaHooks.resolveExternal(storeActivityExternalResolver),
        schemaHooks.resolveResult(storeActivityResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(storeActivityQueryValidator),
        schemaHooks.resolveQuery(storeActivityQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(storeActivityDataValidator),
        schemaHooks.resolveData(storeActivityDataResolver)
      ],
      patch: [
        schemaHooks.validateData(storeActivityPatchValidator),
        schemaHooks.resolveData(storeActivityPatchResolver)
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

  app.service(orderSyncActivityPath).hooks({
    around: {
      all: [authenticateHook]
    }
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [storeActivityPath]: StoreActivityService
    [orderSyncActivityPath]: OrderActivitySyncService
  }
}
