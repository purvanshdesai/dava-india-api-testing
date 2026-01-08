// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type { AppData, AppDataData, AppDataPatch, AppDataQuery } from './app-data.schema'
import { AppDataModel } from './app-data.schema'

export type { AppData, AppDataData, AppDataPatch, AppDataQuery }

export interface AppDataParams extends MongoDBAdapterParams<AppDataQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class AppDataService<ServiceParams extends Params = AppDataParams> extends MongoDBService<
  AppData,
  AppDataData,
  AppDataParams,
  AppDataPatch
> {
  async find(params?: AppDataParams | undefined): Promise<any> {
    try {
      const query: any = params?.query

      if (query?.type) return await AppDataModel.find({ type: query.type }).lean()

      return await super.find(params)
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('app-data'))
  }
}
