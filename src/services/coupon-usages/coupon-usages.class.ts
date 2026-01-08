// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  CouponUsagesModel,
  type CouponUsages,
  type CouponUsagesData,
  type CouponUsagesPatch,
  type CouponUsagesQuery
} from './coupon-usages.schema'

export type { CouponUsages, CouponUsagesData, CouponUsagesPatch, CouponUsagesQuery }

export interface CouponUsagesParams extends MongoDBAdapterParams<CouponUsagesQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class CouponUsagesService<ServiceParams extends Params = CouponUsagesParams> extends MongoDBService<
  CouponUsages,
  CouponUsagesData,
  CouponUsagesParams,
  CouponUsagesPatch
> {
  async find(params?: CouponUsagesParams): Promise<any> {
    try {
      const { query }: any = params || {}
      const couponUsages = await CouponUsagesModel.find(query).lean()
      return couponUsages
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('coupon-usages'))
  }
}
