// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  collectionsDataValidator,
  collectionsPatchValidator,
  collectionsQueryValidator,
  collectionsResolver,
  collectionsExternalResolver,
  collectionsDataResolver,
  collectionsPatchResolver,
  collectionsQueryResolver
} from './collections.schema'

import type { Application } from '../../declarations'
import { CollectionsService, getOptions } from './collections.class'
import { collectionsPath, collectionsMethods } from './collections.shared'

export * from './collections.class'
export * from './collections.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const collections = (app: Application) => {
  // Register our service on the Feathers application
  app.use(collectionsPath, new CollectionsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: collectionsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(collectionsPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(collectionsExternalResolver),
        schemaHooks.resolveResult(collectionsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(collectionsQueryValidator),
        schemaHooks.resolveQuery(collectionsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(collectionsDataValidator),
        schemaHooks.resolveData(collectionsDataResolver)
      ],
      patch: [
        schemaHooks.validateData(collectionsPatchValidator),
        schemaHooks.resolveData(collectionsPatchResolver)
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
    [collectionsPath]: CollectionsService
  }
}
