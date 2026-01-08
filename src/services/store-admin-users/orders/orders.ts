// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  storeAdminUsersOrdersDataValidator,
  storeAdminUsersOrdersPatchValidator,
  storeAdminUsersOrdersQueryValidator,
  storeAdminUsersOrdersResolver,
  storeAdminUsersOrdersExternalResolver,
  storeAdminUsersOrdersDataResolver,
  storeAdminUsersOrdersPatchResolver,
  storeAdminUsersOrdersQueryResolver
} from './orders.schema'

import type { Application } from '../../../declarations'
import { StoreAdminUsersOrdersService, getOptions, StoreAdminAddProductBatchNoService } from './orders.class'
import {
  storeAdminUsersOrdersPath,
  storeAdminUsersOrdersMethods,
  storeAdminAddProductBatchNoPath
} from './orders.shared'
import { storeAdminAddProductBatchEndPoint } from './routeConfig/addProductBatchNo'

export * from './orders.class'
export * from './orders.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const storeAdminUsersOrders = (app: Application) => {
  // Register our service on the Feathers application
  app.use(storeAdminUsersOrdersPath, new StoreAdminUsersOrdersService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: storeAdminUsersOrdersMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(storeAdminUsersOrdersPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'store-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(storeAdminUsersOrdersExternalResolver),
        schemaHooks.resolveResult(storeAdminUsersOrdersResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(storeAdminUsersOrdersQueryValidator),
        schemaHooks.resolveQuery(storeAdminUsersOrdersQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(storeAdminUsersOrdersDataValidator),
        schemaHooks.resolveData(storeAdminUsersOrdersDataResolver)
      ],
      patch: [
        schemaHooks.validateData(storeAdminUsersOrdersPatchValidator),
        schemaHooks.resolveData(storeAdminUsersOrdersPatchResolver)
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

  storeAdminAddProductBatchEndPoint(app)
}

// Add this service to the service type index
declare module '../../../declarations' {
  interface ServiceTypes {
    [storeAdminUsersOrdersPath]: StoreAdminUsersOrdersService
    [storeAdminAddProductBatchNoPath]: StoreAdminAddProductBatchNoService
  }
}
