// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import type { Application } from '../../declarations'
import { DashboardService, getOptions } from './dashboard.class'
import { dashboardPath, dashboardMethods } from './dashboard.shared'
import { authenticateHook } from '../../utils'

export * from './dashboard.class'

// A configure function that registers the service and its hooks via `app.configure`
export const dashboard = (app: Application) => {
  // Register our service on the Feathers application
  app.use(dashboardPath, new DashboardService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: dashboardMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(dashboardPath).hooks({
    around: {
      all: [authenticateHook]
    },
    before: {
      all: [],
      find: []
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
    [dashboardPath]: DashboardService
  }
}
