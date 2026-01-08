// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  bulkUploadProcessDataValidator,
  bulkUploadProcessPatchValidator,
  bulkUploadProcessQueryValidator,
  bulkUploadProcessResolver,
  bulkUploadProcessExternalResolver,
  bulkUploadProcessDataResolver,
  bulkUploadProcessPatchResolver,
  bulkUploadProcessQueryResolver
} from './bulk-upload-process.schema'

import type { Application } from '../../declarations'
import { BulkUploadProcessService, getOptions } from './bulk-upload-process.class'
import { bulkUploadProcessPath, bulkUploadProcessMethods } from './bulk-upload-process.shared'

export * from './bulk-upload-process.class'
export * from './bulk-upload-process.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const bulkUploadProcess = (app: Application) => {
  // Register our service on the Feathers application
  app.use(bulkUploadProcessPath, new BulkUploadProcessService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: bulkUploadProcessMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(bulkUploadProcessPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(bulkUploadProcessExternalResolver),
        schemaHooks.resolveResult(bulkUploadProcessResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(bulkUploadProcessQueryValidator),
        schemaHooks.resolveQuery(bulkUploadProcessQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(bulkUploadProcessDataValidator),
        schemaHooks.resolveData(bulkUploadProcessDataResolver)
      ],
      patch: [
        schemaHooks.validateData(bulkUploadProcessPatchValidator),
        schemaHooks.resolveData(bulkUploadProcessPatchResolver)
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
    [bulkUploadProcessPath]: BulkUploadProcessService
  }
}
