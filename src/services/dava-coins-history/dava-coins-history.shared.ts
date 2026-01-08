// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  DavaCoinsHistory,
  DavaCoinsHistoryData,
  DavaCoinsHistoryPatch,
  DavaCoinsHistoryQuery,
  DavaCoinsHistoryService
} from './dava-coins-history.class'

export type { DavaCoinsHistory, DavaCoinsHistoryData, DavaCoinsHistoryPatch, DavaCoinsHistoryQuery }

export type DavaCoinsHistoryClientService = Pick<
  DavaCoinsHistoryService<Params<DavaCoinsHistoryQuery>>,
  (typeof davaCoinsHistoryMethods)[number]
>

export const davaCoinsHistoryPath = 'dava-coins-history'

export const davaCoinsHistoryMethods: Array<keyof DavaCoinsHistoryService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const davaCoinsHistoryClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(davaCoinsHistoryPath, connection.service(davaCoinsHistoryPath), {
    methods: davaCoinsHistoryMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [davaCoinsHistoryPath]: DavaCoinsHistoryClientService
  }
}
