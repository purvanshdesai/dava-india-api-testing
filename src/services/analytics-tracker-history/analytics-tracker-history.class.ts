// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type {
  AnalyticsTrackerHistory,
  AnalyticsTrackerHistoryData,
  AnalyticsTrackerHistoryPatch,
  AnalyticsTrackerHistoryQuery
} from './analytics-tracker-history.schema'

export type {
  AnalyticsTrackerHistory,
  AnalyticsTrackerHistoryData,
  AnalyticsTrackerHistoryPatch,
  AnalyticsTrackerHistoryQuery
}

export interface AnalyticsTrackerHistoryParams extends MongoDBAdapterParams<AnalyticsTrackerHistoryQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class AnalyticsTrackerHistoryService<
  ServiceParams extends Params = AnalyticsTrackerHistoryParams
> extends MongoDBService<
  AnalyticsTrackerHistory,
  AnalyticsTrackerHistoryData,
  AnalyticsTrackerHistoryParams,
  AnalyticsTrackerHistoryPatch
> {}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('analytics-tracker-history'))
  }
}
