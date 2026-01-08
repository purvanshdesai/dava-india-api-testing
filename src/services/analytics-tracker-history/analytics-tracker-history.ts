// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
// import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  analyticsTrackerHistoryDataValidator,
  analyticsTrackerHistoryPatchValidator,
  analyticsTrackerHistoryQueryValidator,
  analyticsTrackerHistoryResolver,
  analyticsTrackerHistoryExternalResolver,
  analyticsTrackerHistoryDataResolver,
  analyticsTrackerHistoryPatchResolver,
  analyticsTrackerHistoryQueryResolver
} from './analytics-tracker-history.schema'

import type { Application } from '../../declarations'
import { AnalyticsTrackerHistoryService, getOptions } from './analytics-tracker-history.class'
import {
  analyticsTrackerHistoryPath,
  analyticsTrackerHistoryMethods
} from './analytics-tracker-history.shared'
import { setTimestamp } from '../../utils'

export * from './analytics-tracker-history.class'
export * from './analytics-tracker-history.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const analyticsTrackerHistory = (app: Application) => {
  // Register our service on the Feathers application
  app.use(analyticsTrackerHistoryPath, new AnalyticsTrackerHistoryService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: analyticsTrackerHistoryMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(analyticsTrackerHistoryPath).hooks({
    around: {
      all: [
        // authenticate('jwt'),
        schemaHooks.resolveExternal(analyticsTrackerHistoryExternalResolver),
        schemaHooks.resolveResult(analyticsTrackerHistoryResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(analyticsTrackerHistoryQueryValidator),
        schemaHooks.resolveQuery(analyticsTrackerHistoryQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(analyticsTrackerHistoryDataValidator),
        schemaHooks.resolveData(analyticsTrackerHistoryDataResolver),
        setTimestamp
      ],
      patch: [
        schemaHooks.validateData(analyticsTrackerHistoryPatchValidator),
        schemaHooks.resolveData(analyticsTrackerHistoryPatchResolver),
        setTimestamp
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
    [analyticsTrackerHistoryPath]: AnalyticsTrackerHistoryService
  }
}
