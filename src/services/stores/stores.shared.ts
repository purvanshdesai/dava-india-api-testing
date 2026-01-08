// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Stores, StoresData, StoresPatch, StoresQuery, StoresService } from './stores.class'

export type { Stores, StoresData, StoresPatch, StoresQuery }

export type StoresClientService = Pick<StoresService<Params<StoresQuery>>, (typeof storesMethods)[number]>

export const storesPath = 'stores'
export const fetchStoresPostPath = 'fetch-stores-post'

export const storesMethods: Array<keyof StoresService> = ['find', 'get', 'create', 'patch', 'remove']

export const storesClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(storesPath, connection.service(storesPath), {
    methods: storesMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [storesPath]: StoresClientService
  }
}
