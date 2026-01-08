// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type {
  OrderItemTracking,
  OrderItemTrackingData,
  OrderItemTrackingPatch,
  OrderItemTrackingQuery
} from './order-item-tracking.schema'

export type { OrderItemTracking, OrderItemTrackingData, OrderItemTrackingPatch, OrderItemTrackingQuery }

export interface OrderItemTrackingParams extends MongoDBAdapterParams<OrderItemTrackingQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class OrderItemTrackingService<
  ServiceParams extends Params = OrderItemTrackingParams
> extends MongoDBService<
  OrderItemTracking,
  OrderItemTrackingData,
  OrderItemTrackingParams,
  OrderItemTrackingPatch
> {}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('order-item-tracking'))
  }
}
