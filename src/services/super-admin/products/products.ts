// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  productsDataValidator,
  productsPatchValidator,
  productsQueryValidator,
  productsResolver,
  productsExternalResolver,
  productsDataResolver,
  productsPatchResolver,
  productsQueryResolver
} from './products.schema'

import type { Application, HookContext } from '../../../declarations'
import { CollectionProductsService, ProductsService, getOptions } from './products.class'
import { productsPath, productsMethods, setTimestamp, collectionProductsPath } from './products.shared'
import { syncProductWithEs } from '../../../elasticsearch/utils'

export * from './products.class'
export * from './products.schema'

const handleProductChanges = async (context: HookContext) => {
  const { result, event } = context
  await syncProductWithEs({ event, data: result })
  return context
}

// A configure function that registers the service and its hooks via `app.configure`
export const products = (app: Application) => {
  // Register our service on the Feathers application
  app.use(productsPath, new ProductsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: productsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(productsPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(productsExternalResolver),
        schemaHooks.resolveResult(productsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(productsQueryValidator),
        schemaHooks.resolveQuery(productsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(productsDataValidator),
        schemaHooks.resolveData(productsDataResolver),
        setTimestamp
      ],
      patch: [
        schemaHooks.validateData(productsPatchValidator),
        schemaHooks.resolveData(productsPatchResolver),
        setTimestamp
      ],
      remove: []
    },
    after: {
      all: [],
      create: [handleProductChanges],
      patch: [handleProductChanges],
      remove: [handleProductChanges]
    },
    error: {
      all: []
    }
  })

  app.use(collectionProductsPath, new CollectionProductsService(getOptions(app)), {
    methods: productsMethods,
    events: []
  })

  // Initialize hooks for collection products
  app.service(collectionProductsPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(productsExternalResolver),
        schemaHooks.resolveResult(productsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(productsQueryValidator),
        schemaHooks.resolveQuery(productsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(productsDataValidator),
        schemaHooks.resolveData(productsDataResolver),
        setTimestamp
      ],
      patch: [
        schemaHooks.validateData(productsPatchValidator),
        schemaHooks.resolveData(productsPatchResolver),
        setTimestamp
      ],
      remove: []
    },
    after: {
      all: [],
      create: [handleProductChanges],
      patch: [handleProductChanges],
      remove: [handleProductChanges]
    },
    error: {
      all: []
    }
  })
}

// Add this service to the service type index
declare module '../../../declarations' {
  interface ServiceTypes {
    [productsPath]: ProductsService
    [collectionProductsPath]: CollectionProductsService
  }
}
