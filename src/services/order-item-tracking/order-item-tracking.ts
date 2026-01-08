// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  orderItemTrackingDataValidator,
  orderItemTrackingPatchValidator,
  orderItemTrackingQueryValidator,
  orderItemTrackingResolver,
  orderItemTrackingExternalResolver,
  orderItemTrackingDataResolver,
  orderItemTrackingPatchResolver,
  orderItemTrackingQueryResolver
} from './order-item-tracking.schema'

import type { Application } from '../../declarations'
import { OrderItemTrackingService, getOptions } from './order-item-tracking.class'
import { orderItemTrackingPath, orderItemTrackingMethods } from './order-item-tracking.shared'

export * from './order-item-tracking.class'
export * from './order-item-tracking.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const orderItemTracking = (app: Application) => {
  // Register our service on the Feathers application
  app.use(orderItemTrackingPath, new OrderItemTrackingService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: orderItemTrackingMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(orderItemTrackingPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(orderItemTrackingExternalResolver),
        schemaHooks.resolveResult(orderItemTrackingResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(orderItemTrackingQueryValidator),
        schemaHooks.resolveQuery(orderItemTrackingQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(orderItemTrackingDataValidator),
        schemaHooks.resolveData(orderItemTrackingDataResolver)
      ],
      patch: [
        schemaHooks.validateData(orderItemTrackingPatchValidator),
        schemaHooks.resolveData(orderItemTrackingPatchResolver)
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

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [orderItemTrackingPath]: OrderItemTrackingService
  }
}
