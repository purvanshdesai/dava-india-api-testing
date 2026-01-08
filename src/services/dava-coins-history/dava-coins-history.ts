// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  davaCoinsHistoryDataValidator,
  davaCoinsHistoryPatchValidator,
  davaCoinsHistoryQueryValidator,
  davaCoinsHistoryResolver,
  davaCoinsHistoryExternalResolver,
  davaCoinsHistoryDataResolver,
  davaCoinsHistoryPatchResolver,
  davaCoinsHistoryQueryResolver
} from './dava-coins-history.schema'

import type { Application } from '../../declarations'
import { DavaCoinsHistoryService, getOptions } from './dava-coins-history.class'
import { davaCoinsHistoryPath, davaCoinsHistoryMethods } from './dava-coins-history.shared'

export * from './dava-coins-history.class'
export * from './dava-coins-history.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const davaCoinsHistory = (app: Application) => {
  // Register our service on the Feathers application
  app.use(davaCoinsHistoryPath, new DavaCoinsHistoryService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: davaCoinsHistoryMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(davaCoinsHistoryPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(davaCoinsHistoryExternalResolver),
        schemaHooks.resolveResult(davaCoinsHistoryResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(davaCoinsHistoryQueryValidator),
        schemaHooks.resolveQuery(davaCoinsHistoryQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(davaCoinsHistoryDataValidator),
        schemaHooks.resolveData(davaCoinsHistoryDataResolver)
      ],
      patch: [
        schemaHooks.validateData(davaCoinsHistoryPatchValidator),
        schemaHooks.resolveData(davaCoinsHistoryPatchResolver)
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
    [davaCoinsHistoryPath]: DavaCoinsHistoryService
  }
}
