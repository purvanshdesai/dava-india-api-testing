import { Application } from '../../../declarations'
// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

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

import { I18NTranslationService, getOptions } from '../i18n-settings.class'
import { i18NTranslationPath } from '../i18n-settings.shared'

export default function Translations(app: Application) {
  // Register our service on the Feathers application
  app.use(i18NTranslationPath, new I18NTranslationService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['find'],
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(i18NTranslationPath).hooks({
    around: {
      all: [
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
