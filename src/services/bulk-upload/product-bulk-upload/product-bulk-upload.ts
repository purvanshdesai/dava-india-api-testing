// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  productBulkUploadDataValidator,
  productBulkUploadQueryValidator,
  productBulkUploadResolver,
  productBulkUploadExternalResolver,
  productBulkUploadDataResolver,
  productBulkUploadQueryResolver
} from './product-bulk-upload.schema'

import type { Application, HookContext } from '../../../declarations'
import { ProductBulkUploadService, getOptions } from './product-bulk-upload.class'
import { productBulkUploadPath, productBulkUploadMethods } from './product-bulk-upload.shared'

export * from './product-bulk-upload.class'
export * from './product-bulk-upload.schema'

export const validateSignature = async (context: HookContext) => {
  const webhookSecret = '22156571897784958167678822362989'

  const { params } = context

  if (!params.headers || !params.headers['x-davaindia-signature']) {
    throw new Error('Missing signature')
  }

  const providedSignature = params.headers['x-davaindia-signature']

  if (providedSignature !== webhookSecret) throw new Error('Invalid signature')

  return context
}

// A configure function that registers the service and its hooks via `app.configure`
export const productBulkUpload = (app: Application) => {
  // Register our service on the Feathers application
  app.use(productBulkUploadPath, new ProductBulkUploadService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: productBulkUploadMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(productBulkUploadPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(productBulkUploadExternalResolver),
        schemaHooks.resolveResult(productBulkUploadResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(productBulkUploadQueryValidator),
        schemaHooks.resolveQuery(productBulkUploadQueryResolver)
      ],
      create: [
        validateSignature,
        schemaHooks.validateData(productBulkUploadDataValidator),
        schemaHooks.resolveData(productBulkUploadDataResolver)
      ]
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
    [productBulkUploadPath]: ProductBulkUploadService
  }
}
