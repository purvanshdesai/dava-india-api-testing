// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type {
  DownloadExcel,
  DownloadExcelData,
  DownloadExcelPatch,
  DownloadExcelQuery
} from './download-excel.schema'

export type { DownloadExcel, DownloadExcelData, DownloadExcelPatch, DownloadExcelQuery }

export interface DownloadExcelParams extends MongoDBAdapterParams<DownloadExcelQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class DownloadExcelService<ServiceParams extends Params = DownloadExcelParams> extends MongoDBService<
  DownloadExcel,
  DownloadExcelData,
  DownloadExcelParams,
  DownloadExcelPatch
> {}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('download-excel'))
  }
}
