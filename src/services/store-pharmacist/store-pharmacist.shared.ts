// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  StorePharmacist,
  StorePharmacistData,
  StorePharmacistPatch,
  StorePharmacistQuery,
  StorePharmacistService,
  StorePharmacistStoreAdminService
} from './store-pharmacist.class'

export type { StorePharmacist, StorePharmacistData, StorePharmacistPatch, StorePharmacistQuery }

export type StorePharmacistClientService = Pick<
  StorePharmacistService<Params<StorePharmacistQuery>>,
  (typeof storePharmacistMethods)[number]
>

export const storePharmacistPath = 'store-pharmacist'
export const storePharmacistStoreAdminPath = 'store-pharmacist/store-admin'

export const storePharmacistMethods: Array<keyof StorePharmacistService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const storePharmacistClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(storePharmacistPath, connection.service(storePharmacistPath), {
    methods: storePharmacistMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [storePharmacistPath]: StorePharmacistClientService
    [storePharmacistStoreAdminPath]: StorePharmacistStoreAdminService
  }
}
