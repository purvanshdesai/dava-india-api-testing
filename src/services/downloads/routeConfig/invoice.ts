import { downloadInvoiceMethods, downloadInvoicePath } from '../downloads.shared'
import { DownloadInvoiceService, DownloadsService, getOptions } from '../downloads.class'
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import {
  downloadsDataResolver,
  downloadsDataValidator,
  downloadsExternalResolver,
  downloadsPatchResolver,
  downloadsPatchValidator,
  downloadsQueryResolver,
  downloadsQueryValidator,
  downloadsResolver
} from '../downloads.schema'
import type { Application } from '../../../declarations'

export default function DownloadInvoiceEndPoint(app: Application) {
  app.use(downloadInvoicePath, new DownloadInvoiceService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: downloadInvoiceMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(downloadInvoicePath).hooks({
    around: {
      all: [
        // authenticate({
        //   service: 'super-admin/authentication',
        //   strategies: ['jwt']
        // }),
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
}
