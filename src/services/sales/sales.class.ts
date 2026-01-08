// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type { Sales, SalesData, SalesPatch, SalesQuery } from './sales.schema'
import { OrderItemTrackingModal } from '../order-item-tracking/order-item-tracking.schema'
import { ObjectId } from 'mongodb'

export type { Sales, SalesData, SalesPatch, SalesQuery }

export interface SalesServiceOptions {
  app: Application
}

export interface SalesParams extends Params<SalesQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class SalesService {
  constructor(public options: SalesServiceOptions) {}

  async find(params: Params<SalesQuery>): Promise<any> {
    const productId = params.query?.productId
    const orderId = params.query?.orderId
    const user: any = params?.user
    const store = user?.storeIds[0]

    let orderFilter: Array<any> = []

    if (orderId) {
      orderFilter = [{ $match: { 'order.orderId': orderId } }]
    }

    const orderTracking = await OrderItemTrackingModal.aggregate([
      {
        $match: {
          store: store,
          isDeleted: { $ne: true }
        }
      },
      {
        $lookup: {
          from: 'order-items',
          localField: 'items',
          foreignField: '_id',
          as: 'orderItem'
        }
      },
      {
        $match: {
          'orderItem.product': new ObjectId(productId as string)
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'order',
          foreignField: '_id',
          as: 'order'
        }
      },
      {
        $unwind: '$order'
      },
      ...orderFilter,
      {
        $lookup: {
          from: 'products',
          localField: 'orderItem.product',
          foreignField: '_id',
          as: 'orderItem.productDetails'
        }
      },
      {
        $unwind: '$orderItem.productDetails'
      },
      {
        $sort: {
          'order.createdAt': -1 // Sort by createdAt in descending order (use 1 for ascending)
        }
      },
      {
        $facet: {
          data: [{ $skip: params?.query?.$skip || 0 }, { $limit: params?.query?.$limit || 0 }], // Adjust skip and limit as needed
          totalCount: [{ $count: 'count' }]
        }
      }
    ])

    const count = orderTracking[0].totalCount[0] ? orderTracking[0].totalCount[0].count : 0
    const data = orderTracking[0].data

    return {
      data,
      total: count
    }
  }

  async get() {}

  async create() {}

  // This method has to be added to the 'methods' option to make it available to clients
  async update() {}

  async patch() {}

  async remove() {}
}

export const getOptions = (app: Application) => {
  return { app }
}
