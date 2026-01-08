// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  type OrderItems,
  type OrderItemsData,
  type OrderItemsPatch,
  type OrderItemsQuery
} from './order-items.schema'
import { updateBatchNo } from './order-items.shared'

export type { OrderItems, OrderItemsData, OrderItemsPatch, OrderItemsQuery }

export interface OrderItemsParams extends MongoDBAdapterParams<OrderItemsQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class OrderItemsService<ServiceParams extends Params = OrderItemsParams> extends MongoDBService<
  OrderItems,
  OrderItemsData,
  OrderItemsParams,
  OrderItemsPatch
> {}

export class SuperAdminOrderItemsService<
  ServiceParams extends Params = OrderItemsParams
> extends MongoDBService<OrderItems, OrderItemsData, OrderItemsParams, OrderItemsPatch> {
  async create(data: any, params: any): Promise<any> {
    return await updateBatchNo(data)
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('order-items'))
  }
}
