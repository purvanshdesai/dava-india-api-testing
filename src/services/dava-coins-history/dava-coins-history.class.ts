// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  DavaCoinsHistoryModel,
  type DavaCoinsHistory,
  type DavaCoinsHistoryData,
  type DavaCoinsHistoryPatch,
  type DavaCoinsHistoryQuery
} from './dava-coins-history.schema'

export type { DavaCoinsHistory, DavaCoinsHistoryData, DavaCoinsHistoryPatch, DavaCoinsHistoryQuery }

export interface DavaCoinsHistoryParams extends MongoDBAdapterParams<DavaCoinsHistoryQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class DavaCoinsHistoryService<
  ServiceParams extends Params = DavaCoinsHistoryParams
> extends MongoDBService<
  DavaCoinsHistory,
  DavaCoinsHistoryData,
  DavaCoinsHistoryParams,
  DavaCoinsHistoryPatch
> {
  async find(params?: DavaCoinsHistoryParams): Promise<any> {
    try {
      const userId = params?.user?._id

      const coinsHistory = await DavaCoinsHistoryModel.find({ user: userId }).lean()

      return {
        data: coinsHistory,
        total: coinsHistory?.length
      }
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('dava-coins-history'))
  }
}
