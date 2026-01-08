// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type {
  AdminZipCodes,
  AdminZipCodesData,
  AdminZipCodesPatch,
  AdminZipCodesQuery
} from './admin-zip-codes.schema'
import { ZipCodesModel } from '../zip-codes/zip-codes.schema'

export type { AdminZipCodes, AdminZipCodesData, AdminZipCodesPatch, AdminZipCodesQuery }

export interface AdminZipCodesParams extends MongoDBAdapterParams<AdminZipCodesQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class AdminZipCodesService<ServiceParams extends Params = AdminZipCodesParams> extends MongoDBService<
  AdminZipCodes,
  AdminZipCodesData,
  AdminZipCodesParams,
  AdminZipCodesPatch
> {
  async find(params?: any): Promise<any> {
    try {
      const query: any = params?.query || {}
      const searchText = query.searchText || ''
      const limit = parseInt(query.$limit) || 10
      const skip = parseInt(query.$skip) || 0

      const mongoQuery: any[] = []

      // If there is search text, match by zipCode, district, or area
      if (searchText) {
        mongoQuery.push({
          $match: {
            $or: [
              { zipCode: { $regex: searchText, $options: 'i' } },
              { district: { $regex: searchText, $options: 'i' } },
              { area: { $regex: searchText, $options: 'i' } }
            ]
          }
        })
      }

      mongoQuery.push({
        $match: {}
      })

      mongoQuery.push({ $skip: skip })
      mongoQuery.push({ $limit: limit })

      const result = await ZipCodesModel.aggregate(mongoQuery).exec()

      // Count total matching documents
      const totalAggregation = await ZipCodesModel.aggregate([
        {
          $match: searchText
            ? {
                $or: [
                  { zipCode: { $regex: searchText, $options: 'i' } },
                  { district: { $regex: searchText, $options: 'i' } },
                  { area: { $regex: searchText, $options: 'i' } }
                ]
              }
            : {}
        },
        { $count: 'total' }
      ]).exec()

      const total = totalAggregation.length > 0 ? totalAggregation[0].total : 0

      return {
        data: result,
        total,
        limit,
        skip
      }
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('admin-zip-codes'))
  }
}
