// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  downloadExcelDataValidator,
  downloadExcelPatchValidator,
  downloadExcelQueryValidator,
  downloadExcelResolver,
  downloadExcelExternalResolver,
  downloadExcelDataResolver,
  downloadExcelPatchResolver,
  downloadExcelQueryResolver
} from './download-excel.schema'

import type { Application } from '../../declarations'
import { DownloadExcelService, getOptions } from './download-excel.class'
import { downloadExcelPath, downloadExcelMethods } from './download-excel.shared'

export * from './download-excel.class'
export * from './download-excel.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const downloadExcel = (app: Application) => {
  // Register our service on the Feathers application
  app.use(downloadExcelPath, new DownloadExcelService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: downloadExcelMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(downloadExcelPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'store-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(downloadExcelExternalResolver),
        schemaHooks.resolveResult(downloadExcelResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(downloadExcelQueryValidator),
        schemaHooks.resolveQuery(downloadExcelQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(downloadExcelDataValidator),
        schemaHooks.resolveData(downloadExcelDataResolver)
      ],
      patch: [
        schemaHooks.validateData(downloadExcelPatchValidator),
        schemaHooks.resolveData(downloadExcelPatchResolver)
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
    [downloadExcelPath]: DownloadExcelService
  }
}
