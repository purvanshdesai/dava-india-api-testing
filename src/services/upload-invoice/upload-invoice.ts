// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  uploadInvoiceDataValidator,
  uploadInvoicePatchValidator,
  uploadInvoiceQueryValidator,
  uploadInvoiceResolver,
  uploadInvoiceExternalResolver,
  uploadInvoiceDataResolver,
  uploadInvoicePatchResolver,
  uploadInvoiceQueryResolver
} from './upload-invoice.schema'

import type { Application } from '../../declarations'
import { UploadInvoiceService, getOptions } from './upload-invoice.class'
import { uploadInvoicePath, uploadInvoiceMethods } from './upload-invoice.shared'
import { authenticateHook } from '../../utils'

export * from './upload-invoice.class'
export * from './upload-invoice.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const uploadInvoice = (app: Application) => {
  // Register our service on the Feathers application
  app.use(uploadInvoicePath, new UploadInvoiceService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: uploadInvoiceMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(uploadInvoicePath).hooks({
    around: {
      all: [
        authenticateHook,
        schemaHooks.resolveExternal(uploadInvoiceExternalResolver),
        schemaHooks.resolveResult(uploadInvoiceResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(uploadInvoiceQueryValidator),
        schemaHooks.resolveQuery(uploadInvoiceQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(uploadInvoiceDataValidator),
        schemaHooks.resolveData(uploadInvoiceDataResolver)
      ],
      patch: [
        schemaHooks.validateData(uploadInvoicePatchValidator),
        schemaHooks.resolveData(uploadInvoicePatchResolver)
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
    [uploadInvoicePath]: UploadInvoiceService
  }
}
