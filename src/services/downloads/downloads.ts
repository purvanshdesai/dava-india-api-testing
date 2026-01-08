// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  downloadsDataValidator,
  downloadsPatchValidator,
  downloadsQueryValidator,
  downloadsResolver,
  downloadsExternalResolver,
  downloadsDataResolver,
  downloadsPatchResolver,
  downloadsQueryResolver
} from './downloads.schema'

import type { Application } from '../../declarations'
import { DownloadInvoiceService, DownloadsService, getOptions } from './downloads.class'
import { downloadsPath, downloadsMethods, downloadInvoicePath } from './downloads.shared'
import DownloadInvoiceEndPoint from './routeConfig/invoice'

export * from './downloads.class'
export * from './downloads.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const downloads = (app: Application) => {
  // Register our service on the Feathers application
  app.use(downloadsPath, new DownloadsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: downloadsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(downloadsPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(downloadsExternalResolver),
        schemaHooks.resolveResult(downloadsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(downloadsQueryValidator),
        schemaHooks.resolveQuery(downloadsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(downloadsDataValidator),
        schemaHooks.resolveData(downloadsDataResolver)
      ],
      patch: [
        schemaHooks.validateData(downloadsPatchValidator),
        schemaHooks.resolveData(downloadsPatchResolver)
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
  DownloadInvoiceEndPoint(app)
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [downloadsPath]: DownloadsService
    [downloadInvoicePath]: DownloadInvoiceService
  }
}
