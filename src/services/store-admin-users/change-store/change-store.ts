// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  storeAdminUsersChangeStoreDataValidator,
  storeAdminUsersChangeStorePatchValidator,
  storeAdminUsersChangeStoreQueryValidator,
  storeAdminUsersChangeStoreResolver,
  storeAdminUsersChangeStoreExternalResolver,
  storeAdminUsersChangeStoreDataResolver,
  storeAdminUsersChangeStorePatchResolver,
  storeAdminUsersChangeStoreQueryResolver
} from './change-store.schema'

import type { Application } from '../../../declarations'
import {
  StoreAdminPartialOrderTransferService,
  StoreAdminUsersChangeStoreService,
  getOptions
} from './change-store.class'
import {
  storeAdminUsersChangeStorePath,
  storeAdminUsersChangeStoreMethods,
  storeAdminUsersPartialTransferPath
} from './change-store.shared'

export * from './change-store.class'
export * from './change-store.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const storeAdminUsersChangeStore = (app: Application) => {
  // Register our service on the Feathers application
  app.use(storeAdminUsersChangeStorePath, new StoreAdminUsersChangeStoreService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: storeAdminUsersChangeStoreMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(storeAdminUsersChangeStorePath).hooks({
    around: {
      all: [
        authenticate({
          service: 'store-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(storeAdminUsersChangeStoreExternalResolver),
        schemaHooks.resolveResult(storeAdminUsersChangeStoreResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(storeAdminUsersChangeStoreQueryValidator),
        schemaHooks.resolveQuery(storeAdminUsersChangeStoreQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(storeAdminUsersChangeStoreDataValidator),
        schemaHooks.resolveData(storeAdminUsersChangeStoreDataResolver)
      ],
      patch: [
        schemaHooks.validateData(storeAdminUsersChangeStorePatchValidator),
        schemaHooks.resolveData(storeAdminUsersChangeStorePatchResolver)
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
  app.use(storeAdminUsersPartialTransferPath, new StoreAdminPartialOrderTransferService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: storeAdminUsersChangeStoreMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(storeAdminUsersPartialTransferPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'store-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(storeAdminUsersChangeStoreExternalResolver),
        schemaHooks.resolveResult(storeAdminUsersChangeStoreResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(storeAdminUsersChangeStoreQueryValidator),
        schemaHooks.resolveQuery(storeAdminUsersChangeStoreQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(storeAdminUsersChangeStoreDataValidator),
        schemaHooks.resolveData(storeAdminUsersChangeStoreDataResolver)
      ],
      patch: [
        schemaHooks.validateData(storeAdminUsersChangeStorePatchValidator),
        schemaHooks.resolveData(storeAdminUsersChangeStorePatchResolver)
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
    [storeAdminUsersChangeStorePath]: StoreAdminUsersChangeStoreService
    [storeAdminUsersPartialTransferPath]: StoreAdminPartialOrderTransferService
  }
}
