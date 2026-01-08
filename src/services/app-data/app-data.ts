// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  appDataDataValidator,
  appDataPatchValidator,
  appDataQueryValidator,
  appDataResolver,
  appDataExternalResolver,
  appDataDataResolver,
  appDataPatchResolver,
  appDataQueryResolver
} from './app-data.schema'

import type { Application } from '../../declarations'
import { AppDataService, getOptions } from './app-data.class'
import { appDataPath, appDataMethods } from './app-data.shared'

export * from './app-data.class'
export * from './app-data.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const appData = (app: Application) => {
  // Register our service on the Feathers application
  app.use(appDataPath, new AppDataService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: appDataMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(appDataPath).hooks({
    around: {
      all: [
        // authenticate({
        //   service: 'super-admin/authentication',
        //   strategies: ['jwt']
        // }),
        schemaHooks.resolveExternal(appDataExternalResolver),
        schemaHooks.resolveResult(appDataResolver)
      ]
    },
    before: {
      all: [schemaHooks.validateQuery(appDataQueryValidator), schemaHooks.resolveQuery(appDataQueryResolver)],
      find: [],
      get: [],
      create: [schemaHooks.validateData(appDataDataValidator), schemaHooks.resolveData(appDataDataResolver)],
      patch: [schemaHooks.validateData(appDataPatchValidator), schemaHooks.resolveData(appDataPatchResolver)],
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
    [appDataPath]: AppDataService
  }
}
