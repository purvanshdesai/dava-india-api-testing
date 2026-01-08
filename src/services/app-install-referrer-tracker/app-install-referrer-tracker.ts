// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import type { Application } from '../../declarations'
import { AppInstallReferrerTrackerService, getOptions } from './app-install-referrer-tracker.class'
import {
  appInstallReferrerTrackerPath,
  appInstallReferrerTrackerMethods
} from './app-install-referrer-tracker.shared'

export * from './app-install-referrer-tracker.class'

// A configure function that registers the service and its hooks via `app.configure`
export const appInstallReferrerTracker = (app: Application) => {
  // Register our service on the Feathers application
  app.use(appInstallReferrerTrackerPath, new AppInstallReferrerTrackerService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: appInstallReferrerTrackerMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(appInstallReferrerTrackerPath).hooks({
    around: {
      all: []
    },
    before: {
      all: []
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
    [appInstallReferrerTrackerPath]: AppInstallReferrerTrackerService
  }
}
