// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import type { Application } from '../../declarations'
import { ReportsService, getOptions } from './reports.class'
import { reportsPath, reportsMethods } from './reports.shared'

export * from './reports.class'

// A configure function that registers the service and its hooks via `app.configure`
export const reports = (app: Application) => {
  // Register our service on the Feathers application
  app.use(reportsPath, new ReportsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: reportsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(reportsPath).hooks({
    around: {
      // all: [authenticate('jwt')]
    },
    before: {
      all: [],
      create: []
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
    [reportsPath]: ReportsService
  }
}
