// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  superAdminUsersChangeStoreDataValidator,
  superAdminUsersChangeStorePatchValidator,
  superAdminUsersChangeStoreQueryValidator,
  superAdminUsersChangeStoreResolver,
  superAdminUsersChangeStoreExternalResolver,
  superAdminUsersChangeStoreDataResolver,
  superAdminUsersChangeStorePatchResolver,
  superAdminUsersChangeStoreQueryResolver
} from './change-store.schema'

import type { Application } from '../../../declarations'
import {
  SuperAdminPartialOrderTransferService,
  SuperAdminUsersChangeStoreService,
  getOptions
} from './change-store.class'
import {
  superAdminUsersChangeStorePath,
  superAdminUsersChangeStoreMethods,
  superAdminUsersPartialTransferPath
} from './change-store.shared'

export * from './change-store.class'
export * from './change-store.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const superAdminUsersChangeStore = (app: Application) => {
  // Register our service on the Feathers application
  app.use(superAdminUsersChangeStorePath, new SuperAdminUsersChangeStoreService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: superAdminUsersChangeStoreMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(superAdminUsersChangeStorePath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(superAdminUsersChangeStoreExternalResolver),
        schemaHooks.resolveResult(superAdminUsersChangeStoreResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(superAdminUsersChangeStoreQueryValidator),
        schemaHooks.resolveQuery(superAdminUsersChangeStoreQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(superAdminUsersChangeStoreDataValidator),
        schemaHooks.resolveData(superAdminUsersChangeStoreDataResolver)
      ],
      patch: [
        schemaHooks.validateData(superAdminUsersChangeStorePatchValidator),
        schemaHooks.resolveData(superAdminUsersChangeStorePatchResolver)
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
  app.use(superAdminUsersPartialTransferPath, new SuperAdminPartialOrderTransferService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: superAdminUsersChangeStoreMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(superAdminUsersPartialTransferPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(superAdminUsersChangeStoreExternalResolver),
        schemaHooks.resolveResult(superAdminUsersChangeStoreResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(superAdminUsersChangeStoreQueryValidator),
        schemaHooks.resolveQuery(superAdminUsersChangeStoreQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(superAdminUsersChangeStoreDataValidator),
        schemaHooks.resolveData(superAdminUsersChangeStoreDataResolver)
      ],
      patch: [
        schemaHooks.validateData(superAdminUsersChangeStorePatchValidator),
        schemaHooks.resolveData(superAdminUsersChangeStorePatchResolver)
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
    [superAdminUsersChangeStorePath]: SuperAdminUsersChangeStoreService
    [superAdminUsersPartialTransferPath]: SuperAdminPartialOrderTransferService
  }
}
