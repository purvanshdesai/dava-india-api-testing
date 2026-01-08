// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  storeSettingsDataValidator,
  storeSettingsPatchValidator,
  storeSettingsQueryValidator,
  storeSettingsResolver,
  storeSettingsExternalResolver,
  storeSettingsDataResolver,
  storeSettingsPatchResolver,
  storeSettingsQueryResolver
} from './store-settings.schema'

import type { Application } from '../../declarations'
import { StoreSettingsService, getOptions } from './store-settings.class'
import { storeSettingsPath, storeSettingsMethods } from './store-settings.shared'

export * from './store-settings.class'
export * from './store-settings.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const storeSettings = (app: Application) => {
  // Register our service on the Feathers application
  app.use(storeSettingsPath, new StoreSettingsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: storeSettingsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(storeSettingsPath).hooks({
    around: {
      all: [
        // authenticate('jwt'),
        authenticate({
          service: 'store-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(storeSettingsExternalResolver),
        schemaHooks.resolveResult(storeSettingsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(storeSettingsQueryValidator),
        schemaHooks.resolveQuery(storeSettingsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(storeSettingsDataValidator),
        schemaHooks.resolveData(storeSettingsDataResolver)
      ],
      patch: [
        schemaHooks.validateData(storeSettingsPatchValidator),
        schemaHooks.resolveData(storeSettingsPatchResolver)
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
    [storeSettingsPath]: StoreSettingsService
  }
}
