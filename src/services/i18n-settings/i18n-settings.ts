import type { Application } from '../../declarations'
import { I18NSettingsService, I18NTranslationService } from './i18n-settings.class'
import { i18NSettingsPath, i18NTranslationPath } from './i18n-settings.shared'

export * from './i18n-settings.class'
export * from './i18n-settings.schema'

import i18nSettings from './routeConfig/i18n-settings'
import Translations from './routeConfig/translation'

// A configure function that registers the service and its hooks via `app.configure`
export const i18NSettings = (app: Application) => {
  // Route: /i18n-settings
  i18nSettings(app)

  // Route: /i18n-settings/translation
  Translations(app)
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [i18NSettingsPath]: I18NSettingsService
    [i18NTranslationPath]: I18NTranslationService
  }
}
