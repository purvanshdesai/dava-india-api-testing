// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { AppData, AppDataData, AppDataPatch, AppDataQuery, AppDataService } from './app-data.class'

export type { AppData, AppDataData, AppDataPatch, AppDataQuery }

export type AppDataClientService = Pick<AppDataService<Params<AppDataQuery>>, (typeof appDataMethods)[number]>

export const appDataPath = 'app-data'

export const appDataMethods: Array<keyof AppDataService> = ['find', 'get', 'create', 'patch', 'remove']

export const appDataClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(appDataPath, connection.service(appDataPath), {
    methods: appDataMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [appDataPath]: AppDataClientService
  }
}
