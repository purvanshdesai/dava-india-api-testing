// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  I18NSettings,
  I18NSettingsData,
  I18NSettingsPatch,
  I18NSettingsQuery,
  I18NSettingsService
} from './i18n-settings.class'

export type { I18NSettings, I18NSettingsData, I18NSettingsPatch, I18NSettingsQuery }

export type I18NSettingsClientService = Pick<
  I18NSettingsService<Params<I18NSettingsQuery>>,
  (typeof i18NSettingsMethods)[number]
>

export const i18NSettingsPath = 'i18n-settings'
export const i18NTranslationPath = 'i18n-settings/translation'

export const i18NSettingsMethods: Array<keyof I18NSettingsService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const i18NSettingsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(i18NSettingsPath, connection.service(i18NSettingsPath), {
    methods: i18NSettingsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [i18NSettingsPath]: I18NSettingsClientService
  }
}
