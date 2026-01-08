// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  taxesDataValidator,
  taxesPatchValidator,
  taxesQueryValidator,
  taxesResolver,
  taxesExternalResolver,
  taxesDataResolver,
  taxesPatchResolver,
  taxesQueryResolver
} from './taxes.schema'

import type { Application } from '../../declarations'
import { TaxesService, getOptions } from './taxes.class'
import { taxesPath, taxesMethods } from './taxes.shared'

export * from './taxes.class'
export * from './taxes.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const taxes = (app: Application) => {
  // Register our service on the Feathers application
  app.use(taxesPath, new TaxesService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: taxesMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(taxesPath).hooks({
    around: {
      all: [
        // authenticate('jwt'),
        schemaHooks.resolveExternal(taxesExternalResolver),
        schemaHooks.resolveResult(taxesResolver)
      ]
    },
    before: {
      all: [schemaHooks.validateQuery(taxesQueryValidator), schemaHooks.resolveQuery(taxesQueryResolver)],
      find: [],
      get: [],
      create: [schemaHooks.validateData(taxesDataValidator), schemaHooks.resolveData(taxesDataResolver)],
      patch: [schemaHooks.validateData(taxesPatchValidator), schemaHooks.resolveData(taxesPatchResolver)],
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
    [taxesPath]: TaxesService
  }
}
