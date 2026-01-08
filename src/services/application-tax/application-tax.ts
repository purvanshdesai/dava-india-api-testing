// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  applicationTaxDataValidator,
  applicationTaxPatchValidator,
  applicationTaxQueryValidator,
  applicationTaxResolver,
  applicationTaxExternalResolver,
  applicationTaxDataResolver,
  applicationTaxPatchResolver,
  applicationTaxQueryResolver
} from './application-tax.schema'

import type { Application } from '../../declarations'
import { ApplicationTaxService, getOptions } from './application-tax.class'
import { applicationTaxPath, applicationTaxMethods } from './application-tax.shared'

export * from './application-tax.class'
export * from './application-tax.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const applicationTax = (app: Application) => {
  // Register our service on the Feathers application
  app.use(applicationTaxPath, new ApplicationTaxService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: applicationTaxMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(applicationTaxPath).hooks({
    around: {
      all: [
        // authenticate('jwt'),
        schemaHooks.resolveExternal(applicationTaxExternalResolver),
        schemaHooks.resolveResult(applicationTaxResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(applicationTaxQueryValidator),
        schemaHooks.resolveQuery(applicationTaxQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(applicationTaxDataValidator),
        schemaHooks.resolveData(applicationTaxDataResolver)
      ],
      patch: [
        schemaHooks.validateData(applicationTaxPatchValidator),
        schemaHooks.resolveData(applicationTaxPatchResolver)
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
    [applicationTaxPath]: ApplicationTaxService
  }
}
