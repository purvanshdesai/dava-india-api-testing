// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  policiesDataValidator,
  policiesPatchValidator,
  policiesQueryValidator,
  policiesResolver,
  policiesExternalResolver,
  policiesDataResolver,
  policiesPatchResolver,
  policiesQueryResolver
} from './policies.schema'

import type { Application } from '../../declarations'
import { PoliciesService, PoliciesUserService, getOptions } from './policies.class'
import { policiesPath, policiesMethods, policiesUserPath } from './policies.shared'

export * from './policies.class'
export * from './policies.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const policies = (app: Application) => {
  // Register our service on the Feathers application
  app.use(policiesPath, new PoliciesService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: policiesMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(policiesPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(policiesExternalResolver),
        schemaHooks.resolveResult(policiesResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(policiesQueryValidator),
        schemaHooks.resolveQuery(policiesQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(policiesDataValidator),
        schemaHooks.resolveData(policiesDataResolver)
      ],
      patch: [
        schemaHooks.validateData(policiesPatchValidator),
        schemaHooks.resolveData(policiesPatchResolver)
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
  app.use(policiesUserPath, new PoliciesUserService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: policiesMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(policiesUserPath).hooks({
    around: {
      all: [
    
      ]
    },
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [policiesPath]: PoliciesService
     [policiesUserPath]: PoliciesUserService
  }
}
