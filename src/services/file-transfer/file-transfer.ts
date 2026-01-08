// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import type { Application } from '../../declarations'
import { FileTransferService, getOptions } from './file-transfer.class'
import { fileTransferPath, fileTransferMethods } from './file-transfer.shared'
import { authenticate } from '@feathersjs/authentication'

export * from './file-transfer.class'

// A configure function that registers the service and its hooks via `app.configure`
export const fileTransfer = (app: Application) => {
  // Register our service on the Feathers application
  app.use(fileTransferPath, new FileTransferService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: fileTransferMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(fileTransferPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        })
      ]
    },
    before: {
      all: [],
      find: [],
      get: [],
      create: [],
      patch: [],
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
    [fileTransferPath]: FileTransferService
  }
}
