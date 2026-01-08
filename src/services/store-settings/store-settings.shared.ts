// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  StoreSettings,
  StoreSettingsData,
  StoreSettingsPatch,
  StoreSettingsQuery,
  StoreSettingsService
} from './store-settings.class'

export type { StoreSettings, StoreSettingsData, StoreSettingsPatch, StoreSettingsQuery }

export type StoreSettingsClientService = Pick<
  StoreSettingsService<Params<StoreSettingsQuery>>,
  (typeof storeSettingsMethods)[number]
>

export const storeSettingsPath = 'store-settings'

export const storeSettingsMethods: Array<keyof StoreSettingsService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const storeSettingsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(storeSettingsPath, connection.service(storeSettingsPath), {
    methods: storeSettingsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [storeSettingsPath]: StoreSettingsClientService
  }
}
