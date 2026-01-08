// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type { Refund, RefundData, RefundPatch, RefundQuery } from './refund.schema'

export type { Refund, RefundData, RefundPatch, RefundQuery }

export interface RefundParams extends MongoDBAdapterParams<RefundQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class RefundService<ServiceParams extends Params = RefundParams> extends MongoDBService<
  Refund,
  RefundData,
  RefundParams,
  RefundPatch
> {}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('refund'))
  }
}
