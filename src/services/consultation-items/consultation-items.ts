// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  consultationItemsDataValidator,
  consultationItemsPatchValidator,
  consultationItemsQueryValidator,
  consultationItemsResolver,
  consultationItemsExternalResolver,
  consultationItemsDataResolver,
  consultationItemsPatchResolver,
  consultationItemsQueryResolver
} from './consultation-items.schema'

import type { Application } from '../../declarations'
import { ConsultationItemsService, getOptions } from './consultation-items.class'
import { consultationItemsPath, consultationItemsMethods } from './consultation-items.shared'
import { authenticateHook } from '../../utils'

export * from './consultation-items.class'
export * from './consultation-items.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const consultationItems = (app: Application) => {
  // Register our service on the Feathers application
  app.use(consultationItemsPath, new ConsultationItemsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: consultationItemsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(consultationItemsPath).hooks({
    around: {
      all: [
        authenticateHook,
        schemaHooks.resolveExternal(consultationItemsExternalResolver),
        schemaHooks.resolveResult(consultationItemsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(consultationItemsQueryValidator),
        schemaHooks.resolveQuery(consultationItemsQueryResolver)
      ],
      get: []
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
    [consultationItemsPath]: ConsultationItemsService
  }
}
