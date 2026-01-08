// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Paginated, PaginationOptions, Params } from '@feathersjs/feathers'
import { AdapterId, MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../../../declarations'
import type { Variations, VariationsData, VariationsPatch, VariationsQuery } from './variations.schema'
import { BadRequest } from '@feathersjs/errors'
import { ProductsParams } from '../products.class'
import { params } from '@feathersjs/socketio/lib/middleware'
import { ProductsModel } from '../products.schema'

export type { Variations, VariationsData, VariationsPatch, VariationsQuery }

export interface VariationsParams extends MongoDBAdapterParams<VariationsQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class VariationsService<ServiceParams extends Params = VariationsParams> extends MongoDBService<
  Variations,
  VariationsData,
  VariationsParams,
  VariationsPatch
> {
  create(data: VariationsData | VariationsData[], params?: VariationsParams): Promise<any> {
    if (!params || !params.route) throw new BadRequest('Route is required')
    return super.create({ ...data }, params)
  }

  async get(id: AdapterId, params?: VariationsParams): Promise<any> {
    const { query } = params as any
    const { getProducts, ...rest } = query
    const variation: any = await super.get(id, { ...params, query: rest })
    if (getProducts) {
      const products = await ProductsModel.aggregate([{ $match: { variationId: variation._id } }]).exec()
      variation.products = products
    }
    return variation
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('product-variations'))
  }
}
