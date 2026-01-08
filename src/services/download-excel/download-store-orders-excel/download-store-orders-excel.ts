// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  downloadStoreOrdersExcelDataValidator,
  downloadStoreOrdersExcelPatchValidator,
  downloadStoreOrdersExcelQueryValidator,
  downloadStoreOrdersExcelResolver,
  downloadStoreOrdersExcelExternalResolver,
  downloadStoreOrdersExcelDataResolver,
  downloadStoreOrdersExcelPatchResolver,
  downloadStoreOrdersExcelQueryResolver
} from './download-store-orders-excel.schema'

import type { Application } from '../../../declarations'
import { DownloadStoreOrdersExcelService, getOptions } from './download-store-orders-excel.class'
import {
  downloadStoreOrdersExcelPath,
  downloadStoreOrdersExcelMethods
} from './download-store-orders-excel.shared'

export * from './download-store-orders-excel.class'
export * from './download-store-orders-excel.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const downloadStoreOrdersExcel = (app: Application) => {
  // Register our service on the Feathers application
  app.use(downloadStoreOrdersExcelPath, new DownloadStoreOrdersExcelService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: downloadStoreOrdersExcelMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(downloadStoreOrdersExcelPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'store-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(downloadStoreOrdersExcelExternalResolver),
        schemaHooks.resolveResult(downloadStoreOrdersExcelResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(downloadStoreOrdersExcelQueryValidator),
        schemaHooks.resolveQuery(downloadStoreOrdersExcelQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(downloadStoreOrdersExcelDataValidator),
        schemaHooks.resolveData(downloadStoreOrdersExcelDataResolver)
      ],
      patch: [
        schemaHooks.validateData(downloadStoreOrdersExcelPatchValidator),
        schemaHooks.resolveData(downloadStoreOrdersExcelPatchResolver)
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
    [downloadStoreOrdersExcelPath]: DownloadStoreOrdersExcelService
  }
}
