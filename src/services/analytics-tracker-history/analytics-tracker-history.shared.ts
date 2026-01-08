// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  AnalyticsTrackerHistory,
  AnalyticsTrackerHistoryData,
  AnalyticsTrackerHistoryPatch,
  AnalyticsTrackerHistoryQuery,
  AnalyticsTrackerHistoryService
} from './analytics-tracker-history.class'

export type {
  AnalyticsTrackerHistory,
  AnalyticsTrackerHistoryData,
  AnalyticsTrackerHistoryPatch,
  AnalyticsTrackerHistoryQuery
}

export type AnalyticsTrackerHistoryClientService = Pick<
  AnalyticsTrackerHistoryService<Params<AnalyticsTrackerHistoryQuery>>,
  (typeof analyticsTrackerHistoryMethods)[number]
>

export const analyticsTrackerHistoryPath = 'analytics-tracker-history'

export const analyticsTrackerHistoryMethods: Array<keyof AnalyticsTrackerHistoryService> = ['create', 'patch']

export const analyticsTrackerHistoryClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(analyticsTrackerHistoryPath, connection.service(analyticsTrackerHistoryPath), {
    methods: analyticsTrackerHistoryMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [analyticsTrackerHistoryPath]: AnalyticsTrackerHistoryClientService
  }
}
