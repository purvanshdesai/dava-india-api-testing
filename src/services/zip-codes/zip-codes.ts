// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  zipCodesDataValidator,
  zipCodesPatchValidator,
  zipCodesQueryValidator,
  zipCodesResolver,
  zipCodesExternalResolver,
  zipCodesDataResolver,
  zipCodesPatchResolver,
  zipCodesQueryResolver
} from './zip-codes.schema'

import type { Application } from '../../declarations'
import {
  ZipCodesService,
  ConsumerZipCodesService,
  getOptions,
  ZipCodeGet,
  FetchZipCodesPost,
  BulkUploadZipCodesService
} from './zip-codes.class'
import {
  zipCodesPath,
  consumerZipCodesPath,
  zipCodesMethods,
  bulkUploadPincodesPath
} from './zip-codes.shared'

export * from './zip-codes.class'
export * from './zip-codes.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const zipCodes = (app: Application) => {
  // Register our service on the Feathers application
  app.use(zipCodesPath, new ZipCodesService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: zipCodesMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })

  // Register our service on the Feathers application
  app.use(consumerZipCodesPath, new ConsumerZipCodesService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['get', 'find'],
    // You can add additional custom events to be sent to clients here
    events: []
  })

  app.use('zip-codes-get', new ZipCodeGet(), {
    methods: ['get']
  })

  app.use('fetch-zip-codes-post', new FetchZipCodesPost(), {
    methods: ['create']
  })

  app.use(bulkUploadPincodesPath, new BulkUploadZipCodesService(), {
    methods: ['create']
  })

  // Initialize hooks
  app.service(zipCodesPath).hooks({
    around: {
      all: [
        // authenticate({
        //   service: 'super-admin/authentication',
        //   strategies: ['jwt']
        // }),
        schemaHooks.resolveExternal(zipCodesExternalResolver),
        schemaHooks.resolveResult(zipCodesResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(zipCodesQueryValidator),
        schemaHooks.resolveQuery(zipCodesQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(zipCodesDataValidator),
        schemaHooks.resolveData(zipCodesDataResolver)
      ],
      patch: [
        schemaHooks.validateData(zipCodesPatchValidator),
        schemaHooks.resolveData(zipCodesPatchResolver)
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

  app.service(consumerZipCodesPath).hooks({})

  app.service('zip-codes-get').hooks({})

  app.service(bulkUploadPincodesPath).hooks({
    before: {
      create: [
        // Add any validation hooks here if needed
      ]
    }
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [zipCodesPath]: ZipCodesService
    [consumerZipCodesPath]: ConsumerZipCodesService
    ['zip-codes-get']: ZipCodeGet
    ['fetch-zip-codes-post']: FetchZipCodesPost
    [bulkUploadPincodesPath]: BulkUploadZipCodesService
  }
}
