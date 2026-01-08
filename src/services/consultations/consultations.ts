// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  consultationsDataValidator,
  consultationsPatchValidator,
  consultationsQueryValidator,
  consultationsResolver,
  consultationsExternalResolver,
  consultationsDataResolver,
  consultationsPatchResolver,
  consultationsQueryResolver
} from './consultations.schema'

import type { Application } from '../../declarations'
import { ConsultationsService } from './consultations.class'
import { consultationsPath, consultationsMethods } from './consultations.shared'
import { authenticateHook } from '../../utils'

export * from './consultations.class'
export * from './consultations.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const consultations = (app: Application) => {
  // Register our service on the Feathers application
  app.use(consultationsPath, new ConsultationsService(), {
    // A list of all methods this service exposes externally
    methods: consultationsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(consultationsPath).hooks({
    around: {
      all: [
        authenticateHook,
        schemaHooks.resolveExternal(consultationsExternalResolver),
        schemaHooks.resolveResult(consultationsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(consultationsQueryValidator),
        schemaHooks.resolveQuery(consultationsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(consultationsDataValidator),
        schemaHooks.resolveData(consultationsDataResolver)
      ],
      patch: [
        schemaHooks.validateData(consultationsPatchValidator),
        schemaHooks.resolveData(consultationsPatchResolver)
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
    [consultationsPath]: ConsultationsService
  }
}
