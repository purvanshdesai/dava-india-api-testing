import { Application } from '../../../declarations'
// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  i18NSettingsDataValidator,
  i18NSettingsPatchValidator,
  i18NSettingsQueryValidator,
  i18NSettingsResolver,
  i18NSettingsExternalResolver,
  i18NSettingsDataResolver,
  i18NSettingsPatchResolver,
  i18NSettingsQueryResolver
} from '../i18n-settings.schema'

import { I18NSettingsService, getOptions } from '../i18n-settings.class'
import { i18NSettingsPath, i18NSettingsMethods } from '../i18n-settings.shared'
import { createSwaggerServiceOptions } from 'feathers-swagger'

export default function i18nSettings(app: Application) {
  // Register our service on the Feathers application
  app.use(i18NSettingsPath, new I18NSettingsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: i18NSettingsMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
    docs: createSwaggerServiceOptions({
      schemas: {},
      docs: {
        securities: ['find', 'get', 'patch', 'remove'],
        operations: {
          find: {
            summary: 'Gel all business',
            description: 'Endpoint fetches all business of company id provided in path'
          }
        }
      }
    })
  })
  // Initialize hooks
  app.service(i18NSettingsPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(i18NSettingsExternalResolver),
        schemaHooks.resolveResult(i18NSettingsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(i18NSettingsQueryValidator),
        schemaHooks.resolveQuery(i18NSettingsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(i18NSettingsDataValidator),
        schemaHooks.resolveData(i18NSettingsDataResolver)
      ],
      patch: [
        schemaHooks.validateData(i18NSettingsPatchValidator),
        schemaHooks.resolveData(i18NSettingsPatchResolver)
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
