// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  adminZipCodesDataValidator,
  adminZipCodesPatchValidator,
  adminZipCodesQueryValidator,
  adminZipCodesResolver,
  adminZipCodesExternalResolver,
  adminZipCodesDataResolver,
  adminZipCodesPatchResolver,
  adminZipCodesQueryResolver
} from './admin-zip-codes.schema'

import type { Application } from '../../declarations'
import { AdminZipCodesService, getOptions } from './admin-zip-codes.class'
import { adminZipCodesPath, adminZipCodesMethods } from './admin-zip-codes.shared'

export * from './admin-zip-codes.class'
export * from './admin-zip-codes.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const adminZipCodes = (app: Application) => {
  // Register our service on the Feathers application
  app.use(adminZipCodesPath, new AdminZipCodesService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: adminZipCodesMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(adminZipCodesPath).hooks({
    around: {
      all: [
        // authenticate('jwt'),
        schemaHooks.resolveExternal(adminZipCodesExternalResolver),
        schemaHooks.resolveResult(adminZipCodesResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(adminZipCodesQueryValidator),
        schemaHooks.resolveQuery(adminZipCodesQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(adminZipCodesDataValidator),
        schemaHooks.resolveData(adminZipCodesDataResolver)
      ],
      patch: [
        schemaHooks.validateData(adminZipCodesPatchValidator),
        schemaHooks.resolveData(adminZipCodesPatchResolver)
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
    [adminZipCodesPath]: AdminZipCodesService
  }
}
