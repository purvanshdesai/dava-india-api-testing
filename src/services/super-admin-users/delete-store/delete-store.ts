// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  superAdminUsersDeleteStoreDataValidator,
  superAdminUsersDeleteStorePatchValidator,
  superAdminUsersDeleteStoreQueryValidator,
  superAdminUsersDeleteStoreResolver,
  superAdminUsersDeleteStoreExternalResolver,
  superAdminUsersDeleteStoreDataResolver,
  superAdminUsersDeleteStorePatchResolver,
  superAdminUsersDeleteStoreQueryResolver
} from './delete-store.schema'

import type { Application } from '../../../declarations'
import { SuperAdminUsersDeleteStoreService, getOptions } from './delete-store.class'
import { superAdminUsersDeleteStorePath, superAdminUsersDeleteStoreMethods } from './delete-store.shared'

export * from './delete-store.class'
export * from './delete-store.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const superAdminUsersDeleteStore = (app: Application) => {
  // Register our service on the Feathers application
  app.use(superAdminUsersDeleteStorePath, new SuperAdminUsersDeleteStoreService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: superAdminUsersDeleteStoreMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(superAdminUsersDeleteStorePath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(superAdminUsersDeleteStoreExternalResolver),
        schemaHooks.resolveResult(superAdminUsersDeleteStoreResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(superAdminUsersDeleteStoreQueryValidator),
        schemaHooks.resolveQuery(superAdminUsersDeleteStoreQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(superAdminUsersDeleteStoreDataValidator),
        schemaHooks.resolveData(superAdminUsersDeleteStoreDataResolver)
      ],
      patch: [
        schemaHooks.validateData(superAdminUsersDeleteStorePatchValidator),
        schemaHooks.resolveData(superAdminUsersDeleteStorePatchResolver)
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
declare module '../../../declarations' {
  interface ServiceTypes {
    [superAdminUsersDeleteStorePath]: SuperAdminUsersDeleteStoreService
  }
}
