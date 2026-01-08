// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  settingsDataValidator,
  settingsPatchValidator,
  settingsQueryValidator,
  settingsResolver,
  settingsExternalResolver,
  settingsDataResolver,
  settingsPatchResolver,
  settingsQueryResolver
} from './settings.schema'

import type { Application } from '../../declarations'
import { SettingsService, getOptions } from './settings.class'
import { settingsPath, settingsMethods } from './settings.shared'

export * from './settings.class'
export * from './settings.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const settings = (app: Application) => {
  // Register our service on the Feathers application
  app.use(settingsPath, new SettingsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: settingsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(settingsPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(settingsExternalResolver),
        schemaHooks.resolveResult(settingsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(settingsQueryValidator),
        schemaHooks.resolveQuery(settingsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(settingsDataValidator),
        schemaHooks.resolveData(settingsDataResolver)
      ],
      patch: [
        schemaHooks.validateData(settingsPatchValidator),
        schemaHooks.resolveData(settingsPatchResolver)
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
    [settingsPath]: SettingsService
  }
}
