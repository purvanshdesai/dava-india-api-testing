// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type { BulkUpload, BulkUploadData, BulkUploadPatch, BulkUploadQuery } from './bulk-upload.schema'

export type { BulkUpload, BulkUploadData, BulkUploadPatch, BulkUploadQuery }

export interface BulkUploadParams extends MongoDBAdapterParams<BulkUploadQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class BulkUploadService<ServiceParams extends Params = BulkUploadParams> extends MongoDBService<
  BulkUpload,
  BulkUploadData,
  BulkUploadParams,
  BulkUploadPatch
> {}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('bulk-upload'))
  }
}
