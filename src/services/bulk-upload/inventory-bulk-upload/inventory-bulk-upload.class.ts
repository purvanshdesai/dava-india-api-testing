// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../../declarations'
import type {
  InventoryBulkUpload,
  InventoryBulkUploadData,
  InventoryBulkUploadPatch,
  InventoryBulkUploadQuery
} from './inventory-bulk-upload.schema'
// import { addToBulkUploadFillProcessQueue } from '../../../jobs/queues/queue'
import { createBulkUploadProcessEntry } from './inventory-bulk-upload.shared'
import { publishToInventoryUploadServer } from '../../../utils/inventory-upload'

export type {
  InventoryBulkUpload,
  InventoryBulkUploadData,
  InventoryBulkUploadPatch,
  InventoryBulkUploadQuery
}

export interface InventoryBulkUploadParams extends MongoDBAdapterParams<InventoryBulkUploadQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class InventoryBulkUploadService<
  ServiceParams extends Params = InventoryBulkUploadParams
> extends MongoDBService<
  InventoryBulkUpload,
  InventoryBulkUploadData,
  InventoryBulkUploadParams,
  InventoryBulkUploadPatch
> {
  async create(data: any, params?: any): Promise<any> {
    // 1. Insert information into bulk upload process table
    const process: any = await createBulkUploadProcessEntry({
      errorsCount: 0,
      total: 0,
      user: params.user,
      userType: 'store-admin',
      processName: data?.processName
    })

    const { user } = params ?? {}

    await publishToInventoryUploadServer({
      fileUrl: data?.objectUrl,
      processId: process?._id.toString(),
      user: {
        _id: user._id.toString(),
        authorizedStoreIds: user?.storeIds
      }
    })

    // await addToBulkUploadFillProcessQueue({
    //   data,
    //   params: {
    //     query: params?.query || {},
    //     user: params?.user || {},
    //     process
    //   },
    //   type: 'file-process'
    // })

    return { message: 'Inventory upload in progress' }
  }
}

export class SuperAdminInventoryBulkUploadService<
  ServiceParams extends Params = InventoryBulkUploadParams
> extends MongoDBService<
  InventoryBulkUpload,
  InventoryBulkUploadData,
  InventoryBulkUploadParams,
  InventoryBulkUploadPatch
> {
  async create(data: any, params?: any): Promise<any> {
    // 1. Insert information into bulk upload process table
    const process: any = await createBulkUploadProcessEntry({
      errorsCount: 0,
      total: 0,
      user: params.user,
      userType: 'super-admin',
      processName: data?.processName
    })

    const { user } = params ?? {}

    await publishToInventoryUploadServer({
      fileUrl: data?.objectUrl,
      processId: process?._id.toString(),
      user: {
        _id: user._id.toString(),
        authorizedStoreIds: user?.storeIds
      }
    })

    // await addToBulkUploadFillProcessQueue({
    //   data,
    //   params: {
    //     query: params?.query || {},
    //     user: params?.user || {},
    //     process
    //   },
    //   type: 'file-process'
    // })

    return { message: 'Inventory upload in progress' }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('bulk-upload-inventory-bulk-upload'))
  }
}
