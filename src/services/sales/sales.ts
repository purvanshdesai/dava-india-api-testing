// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  salesDataValidator,
  salesPatchValidator,
  salesQueryValidator,
  salesResolver,
  salesExternalResolver,
  salesDataResolver,
  salesPatchResolver,
  salesQueryResolver
} from './sales.schema'

import type { Application } from '../../declarations'
import { SalesService, getOptions } from './sales.class'
import { salesPath, salesMethods } from './sales.shared'

export * from './sales.class'
export * from './sales.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const sales = (app: Application) => {
  // Register our service on the Feathers application
  app.use(salesPath, new SalesService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: salesMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(salesPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'store-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(salesExternalResolver),
        schemaHooks.resolveResult(salesResolver)
      ]
    },
    before: {
      all: [schemaHooks.validateQuery(salesQueryValidator), schemaHooks.resolveQuery(salesQueryResolver)],
      find: [],
      get: [],
      create: [schemaHooks.validateData(salesDataValidator), schemaHooks.resolveData(salesDataResolver)],
      patch: [schemaHooks.validateData(salesPatchValidator), schemaHooks.resolveData(salesPatchResolver)],
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
    [salesPath]: SalesService
  }
}
