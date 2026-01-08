// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  GlobalSearch,
  GlobalSearchData,
  GlobalSearchPatch,
  GlobalSearchQuery,
  GlobalSearchService
} from './global-search.class'

export type { GlobalSearch, GlobalSearchData, GlobalSearchPatch, GlobalSearchQuery }

export type GlobalSearchClientService = Pick<
  GlobalSearchService<Params<GlobalSearchQuery>>,
  (typeof globalSearchMethods)[number]
>

export const globalSearchPath = 'global-search'
export const globalSearchSuggestionPath = 'global-search/suggestions'

export const globalSearchMethods: Array<keyof GlobalSearchService> = ['find', 'create', 'remove']

export const globalSearchClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(globalSearchPath, connection.service(globalSearchPath), {
    methods: globalSearchMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [globalSearchPath]: GlobalSearchClientService
  }
}
