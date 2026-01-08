// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type {
  StoreSettings,
  StoreSettingsData,
  StoreSettingsPatch,
  StoreSettingsQuery
} from './store-settings.schema'
import { StoreModel } from '../stores/stores.schema'

export type { StoreSettings, StoreSettingsData, StoreSettingsPatch, StoreSettingsQuery }

export interface StoreSettingsParams extends MongoDBAdapterParams<StoreSettingsQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class StoreSettingsService<ServiceParams extends Params = StoreSettingsParams> extends MongoDBService<
  StoreSettings,
  StoreSettingsData,
  StoreSettingsParams,
  StoreSettingsPatch
> {
  async patch(id: any, data: any, params?: any): Promise<any> {
    try {
      const user = params?.user
      const store = user?.storeIds[0]
      const payload = {
        low_stock_threshold: data?.data?.lockStockWarning ? Number(data?.data?.lockStockWarning) : 0,
        out_of_stock_threshold: data?.data?.outOfStockWarning ? Number(data?.data?.outOfStockWarning) : 0,
        low_stock_threshold_status: data?.data?.lockStockWarningStatus ?? false,
        out_of_stock_threshold_status: data?.data?.outOfStockWarningStatus ?? false,
        assignee: Array.isArray(data?.data?.assignee) ? data?.data?.assignee : []
      }
      return await StoreModel.findByIdAndUpdate(store, { $set: { storeSettings: payload } }, { new: true })
    } catch (error) {
      throw error
    }
  }

  async find(params?: any): Promise<any> {
    try {
      const user: any = params?.user
      const store = user?.storeIds[0]
      const orderTrackingItems = await StoreModel.findById(store).lean()

      return orderTrackingItems
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('stores'))
  }
}
