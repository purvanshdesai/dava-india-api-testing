// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  storePharmacistDataValidator,
  storePharmacistPatchValidator,
  storePharmacistQueryValidator,
  storePharmacistResolver,
  storePharmacistExternalResolver,
  storePharmacistDataResolver,
  storePharmacistPatchResolver,
  storePharmacistQueryResolver
} from './store-pharmacist.schema'

import type { Application } from '../../declarations'
import {
  StorePharmacistService,
  StorePharmacistStoreAdminService,
  getOptions
} from './store-pharmacist.class'
import {
  storePharmacistPath,
  storePharmacistMethods,
  storePharmacistStoreAdminPath
} from './store-pharmacist.shared'
import type { HookContext } from '@feathersjs/feathers'

// Hook to remove __v and other mongoose internal fields before validation
const removeMongooseInternalFields = async (context: HookContext) => {
  if (context.data) {
    const { __v, ...cleanData } = context.data
    context.data = cleanData
  }
  return context
}

export * from './store-pharmacist.class'
export * from './store-pharmacist.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const storePharmacist = (app: Application) => {
  // Register our service on the Feathers application
  app.use(storePharmacistPath, new StorePharmacistService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: storePharmacistMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(storePharmacistPath).hooks({
    around: {
      all: [
        authenticate({ service: 'super-admin/authentication', strategies: ['jwt'] }),
        schemaHooks.resolveExternal(storePharmacistExternalResolver),
        schemaHooks.resolveResult(storePharmacistResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(storePharmacistQueryValidator),
        schemaHooks.resolveQuery(storePharmacistQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(storePharmacistDataValidator),
        schemaHooks.resolveData(storePharmacistDataResolver)
      ],
      patch: [
        removeMongooseInternalFields,
        schemaHooks.validateData(storePharmacistPatchValidator),
        schemaHooks.resolveData(storePharmacistPatchResolver)
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

  app.use(storePharmacistStoreAdminPath, new StorePharmacistStoreAdminService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: storePharmacistMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(storePharmacistStoreAdminPath).hooks({
    around: {
      all: [
        authenticate({ service: 'store-admin/authentication', strategies: ['jwt'] }),
        schemaHooks.resolveExternal(storePharmacistExternalResolver),
        schemaHooks.resolveResult(storePharmacistResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(storePharmacistQueryValidator),
        schemaHooks.resolveQuery(storePharmacistQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(storePharmacistDataValidator),
        schemaHooks.resolveData(storePharmacistDataResolver)
      ],
      patch: [
        removeMongooseInternalFields,
        schemaHooks.validateData(storePharmacistPatchValidator),
        schemaHooks.resolveData(storePharmacistPatchResolver)
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
    [storePharmacistPath]: StorePharmacistService
    [storePharmacistStoreAdminPath]: StorePharmacistStoreAdminService
  }
}
