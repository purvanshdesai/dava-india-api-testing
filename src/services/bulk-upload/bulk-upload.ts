// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  bulkUploadDataValidator,
  bulkUploadPatchValidator,
  bulkUploadQueryValidator,
  bulkUploadResolver,
  bulkUploadExternalResolver,
  bulkUploadDataResolver,
  bulkUploadPatchResolver,
  bulkUploadQueryResolver
} from './bulk-upload.schema'

import type { Application } from '../../declarations'
import { BulkUploadService, getOptions } from './bulk-upload.class'
import { bulkUploadPath, bulkUploadMethods } from './bulk-upload.shared'

export * from './bulk-upload.class'
export * from './bulk-upload.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const bulkUpload = (app: Application) => {
  // Register our service on the Feathers application
  app.use(bulkUploadPath, new BulkUploadService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: bulkUploadMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(bulkUploadPath).hooks({
    around: {
      all: [
        // authenticate('jwt'),
        schemaHooks.resolveExternal(bulkUploadExternalResolver),
        schemaHooks.resolveResult(bulkUploadResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(bulkUploadQueryValidator),
        schemaHooks.resolveQuery(bulkUploadQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(bulkUploadDataValidator),
        schemaHooks.resolveData(bulkUploadDataResolver)
      ],
      patch: [
        schemaHooks.validateData(bulkUploadPatchValidator),
        schemaHooks.resolveData(bulkUploadPatchResolver)
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
    [bulkUploadPath]: BulkUploadService
  }
}
