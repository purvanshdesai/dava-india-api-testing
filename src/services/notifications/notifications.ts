// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  notificationsDataValidator,
  notificationsPatchValidator,
  notificationsQueryValidator,
  notificationsResolver,
  notificationsExternalResolver,
  notificationsDataResolver,
  notificationsPatchResolver,
  notificationsQueryResolver
} from './notifications.schema'

import type { Application } from '../../declarations'
import { NotificationsService, getOptions } from './notifications.class'
import { notificationsPath, notificationsMethods } from './notifications.shared'
import { authenticateHook } from '../../utils'

export * from './notifications.class'
export * from './notifications.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const notifications = (app: Application) => {
  // Register our service on the Feathers application
  app.use(notificationsPath, new NotificationsService(), {
    // A list of all methods this service exposes externally
    methods: notificationsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(notificationsPath).hooks({
    around: {
      all: [
        authenticateHook,
        schemaHooks.resolveExternal(notificationsExternalResolver),
        schemaHooks.resolveResult(notificationsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(notificationsQueryValidator),
        schemaHooks.resolveQuery(notificationsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(notificationsDataValidator),
        schemaHooks.resolveData(notificationsDataResolver)
      ],
      patch: [
        schemaHooks.validateData(notificationsPatchValidator),
        schemaHooks.resolveData(notificationsPatchResolver)
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
    [notificationsPath]: NotificationsService
  }
}
