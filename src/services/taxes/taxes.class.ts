// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import { TaxesModel, type Taxes, type TaxesData, type TaxesPatch, type TaxesQuery } from './taxes.schema'
import { ProductsModel } from '../super-admin/products/products.schema'
import { ObjectId } from 'mongodb'

export type { Taxes, TaxesData, TaxesPatch, TaxesQuery }

export interface TaxesParams extends MongoDBAdapterParams<TaxesQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class TaxesService<ServiceParams extends Params = TaxesParams> extends MongoDBService<
  Taxes,
  TaxesData,
  TaxesParams,
  TaxesPatch
> {
  async remove(id: any, params?: any): Promise<any> {
    try {
      const d = await ProductsModel.findOne({ taxes: new ObjectId(id) }).lean()
      if (d?._id) {
        const updateTaxes = d?.taxes?.filter((item: any) => item.toString() != id)
        await ProductsModel.findByIdAndUpdate(d?._id, { taxes: updateTaxes })
      }
      await TaxesModel.findByIdAndDelete(id)
      return {
        message: 'Deleted successfully'
      }
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('taxes'))
  }
}
