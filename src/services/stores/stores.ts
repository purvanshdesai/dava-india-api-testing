// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  storesDataResolver,
  storesDataValidator,
  storesExternalResolver,
  storesPatchResolver,
  storesPatchValidator,
  storesQueryResolver,
  storesQueryValidator,
  storesResolver
} from './stores.schema'

import type { Application } from '../../declarations'
import { FetchStoresPost, getOptions, StoresService } from './stores.class'
import { fetchStoresPostPath, storesMethods, storesPath } from './stores.shared'
import { handleAction } from '../../cachedResources/order/'

export * from './stores.class'
export * from './stores.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const stores = (app: Application) => {
  // Register our service on the Feathers application
  app.use(storesPath, new StoresService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: storesMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(storesPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(storesExternalResolver),
        schemaHooks.resolveResult(storesResolver)
      ]
    },
    before: {
      all: [schemaHooks.validateQuery(storesQueryValidator), schemaHooks.resolveQuery(storesQueryResolver)],
      find: [],
      get: [],
      create: [schemaHooks.validateData(storesDataValidator), schemaHooks.resolveData(storesDataResolver)],
      patch: [
        schemaHooks.validateData(storesPatchValidator),
        schemaHooks.resolveData(storesPatchResolver),
        async (context) => {
          if (context.id) {
            const previous = await context.service.get(context.id);
            context.params.previous = previous; // Store previous data
          }
          return context;
        },
      ],
      remove: []
    },
    after: {
      all: [],
      create: [
        async (context) => {
          await handleAction('addStore', context); // add the store's geoinfo to redis
          return context;
        }
      ],
      patch: [
        async (context) => {
          await handleAction('updateStore', context); // update or remove the associated geoinfo from redis
          return context;
        }
      ],
    },
    error: {
      all: []
    }
  })

  app.use(fetchStoresPostPath, new FetchStoresPost(), {
    methods: ['create']
  })
  app.service(fetchStoresPostPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        })
      ]
    }
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [storesPath]: StoresService
    [fetchStoresPostPath]: FetchStoresPost
  }
}
