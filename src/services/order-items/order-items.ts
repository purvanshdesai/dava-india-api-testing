// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import type { Application } from '../../declarations'
import { SuperAdminOrderItemsService, getOptions } from './order-items.class'
import { superAdminOrderItemsPath } from './order-items.shared'
import { authenticateHook } from '../../utils'

export * from './order-items.class'
export * from './order-items.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const orderItems = (app: Application) => {
  // Register our service on the Feathers application
  app.use(superAdminOrderItemsPath, new SuperAdminOrderItemsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['create'],
    // You can add additional custom events to be sent to clients here
    events: []
  })

  // Initialize hooks
  app.service(superAdminOrderItemsPath).hooks({
    around: {
      all: [authenticateHook]
    }
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [superAdminOrderItemsPath]: SuperAdminOrderItemsService
  }
}
