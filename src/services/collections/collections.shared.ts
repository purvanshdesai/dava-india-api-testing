// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Collections,
  CollectionsData,
  CollectionsPatch,
  CollectionsQuery,
  CollectionsService
} from './collections.class'

export type { Collections, CollectionsData, CollectionsPatch, CollectionsQuery }

export type CollectionsClientService = Pick<
  CollectionsService<Params<CollectionsQuery>>,
  (typeof collectionsMethods)[number]
>

export const collectionsPath = 'collections'

export const collectionsMethods: Array<keyof CollectionsService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const collectionsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(collectionsPath, connection.service(collectionsPath), {
    methods: collectionsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [collectionsPath]: CollectionsClientService
  }
}
