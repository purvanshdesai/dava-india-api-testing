// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  BulkUploadProcessModel,
  type BulkUploadProcess,
  type BulkUploadProcessData,
  type BulkUploadProcessPatch,
  type BulkUploadProcessQuery
} from './bulk-upload-process.schema'
import { excludeFieldsInObject } from '../../utils'

export type { BulkUploadProcess, BulkUploadProcessData, BulkUploadProcessPatch, BulkUploadProcessQuery }

export interface BulkUploadProcessParams extends MongoDBAdapterParams<BulkUploadProcessQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class BulkUploadProcessService<
  ServiceParams extends Params = BulkUploadProcessParams
> extends MongoDBService<
  BulkUploadProcess,
  BulkUploadProcessData,
  BulkUploadProcessParams,
  BulkUploadProcessPatch
> {
  async find(params?: BulkUploadProcessParams | undefined): Promise<any> {
    try {
      const query = params?.query
      const baseQuery = excludeFieldsInObject(['$limit', '$skip', '$sort'], query)

      const stores = await BulkUploadProcessModel.find({ ...baseQuery })
        .populate('storeAdminUser', '_id email')
        .populate('superAdminUser', '_id name')
        .lean()
        .sort({ _id: -1 })
        .limit(query?.$limit || 0)
        .skip(query?.$skip || 0)

      const storesTotal = await BulkUploadProcessModel.countDocuments({ ...baseQuery })

      return {
        data: stores,
        total: storesTotal
      }
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('bulk-upload-process'))
  }
}
