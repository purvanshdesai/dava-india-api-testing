// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Settings, SettingsData, SettingsPatch, SettingsQuery, SettingsService } from './settings.class'

export type { Settings, SettingsData, SettingsPatch, SettingsQuery }

export type SettingsClientService = Pick<
  SettingsService<Params<SettingsQuery>>,
  (typeof settingsMethods)[number]
>

export const settingsPath = 'settings'

export const settingsMethods: Array<keyof SettingsService> = ['find', 'get', 'create', 'patch', 'remove']

export const settingsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(settingsPath, connection.service(settingsPath), {
    methods: settingsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [settingsPath]: SettingsClientService
  }
}
