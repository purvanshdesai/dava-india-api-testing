// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params } from '@feathersjs/feathers'

import type { Application } from '../../../declarations'
import type {
  StoreAdminUsersPrescriptionStatus,
  StoreAdminUsersPrescriptionStatusData,
  StoreAdminUsersPrescriptionStatusPatch,
  StoreAdminUsersPrescriptionStatusQuery
} from './prescription-status.schema'
import { OrderModel } from '../../order/order.schema'
import { BadRequest } from '@feathersjs/errors'
import { OrderItemTrackingModal } from '../../order-item-tracking/order-item-tracking.schema'
import { AppDataModel } from '../../app-data/app-data.schema'
import { refundOrderPayment } from '../../../payments/refund'

export type {
  StoreAdminUsersPrescriptionStatus,
  StoreAdminUsersPrescriptionStatusData,
  StoreAdminUsersPrescriptionStatusPatch,
  StoreAdminUsersPrescriptionStatusQuery
}

export interface StoreAdminUsersPrescriptionStatusServiceOptions {
  app: Application
}

export interface StoreAdminUsersPrescriptionStatusParams
  extends Params<StoreAdminUsersPrescriptionStatusQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class StoreAdminUsersPrescriptionStatusService {
  constructor(public options: StoreAdminUsersPrescriptionStatusServiceOptions) {}

  async find(_params?: any): Promise<StoreAdminUsersPrescriptionStatus[]> {
    return []
  }

  async get(id: Id, _params?: any): Promise<any> {
    return {
      id: 0,
      text: `A new message with ID: ${id}!`
    }
  }

  async create(data: StoreAdminUsersPrescriptionStatusData, params: any) {
    try {
      const user = params?.user
      const stores = user?.storeIds
      const { orderId, status, storeId, orderTrackingId } = data
      // const userHasStore = stores?.find((store: any) => store?.toString() == storeId)
      // if (!userHasStore) throw new BadRequest('Store not found')
      if (status == 'reject') {
        const order = await OrderModel.findById(orderId).lean()
        if (!order) throw new BadRequest('Order not found')

        // await refundOrderPayment(order?._id?.toString())

        const orderTracking: any = await OrderItemTrackingModal.findById(orderTrackingId)
          .populate('items')
          .lean()

        if (!orderTracking) throw new BadRequest('Order not found')
        const storeChangeActivity = await AppDataModel.findOne({
          type: 'order-tracking-status',
          statusCode: 'prescription_declined'
        })

        const timeline = orderTracking.timeline ?? []

        timeline.push({
          label: storeChangeActivity?.name,
          date: new Date(),
          authorName: params?.user?.name,
          authorId: params?.user?._id.toString(),
          comment: `Prescription Reject`, // TODO save change store note and cancel reason here
          statusCode: storeChangeActivity?.statusCode,
          previousStoreId: orderTracking.store,
          userType: user.userType
        })

        const trackingItem: any = await OrderItemTrackingModal.findByIdAndUpdate(orderTrackingId, {
          $set: {
            timeline,
            lastTimelineStatus: storeChangeActivity?.statusCode
          }
        })
        // if (trackingItem) await manageProductQuantityFromOrderTrackingId(trackingItem._id.toString(), 'add')
        return {
          // message: 'Refund initiated'
        }
      } else if (status == 'accept') {
        const order = await OrderModel.findById(orderId).lean()
        if (!order) throw new BadRequest('Not found')
        await OrderModel.findByIdAndUpdate(order?._id, {
          isPrescriptionAccepted: true
        })

        const orderTracking: any = await OrderItemTrackingModal.findById(orderTrackingId)
          .populate('items')
          .lean()

        if (!orderTracking) throw new BadRequest('Order not found')
        const storeChangeActivity = await AppDataModel.findOne({
          type: 'order-tracking-status',
          statusCode: 'prescription_approved'
        })
        const timeline = orderTracking.timeline ?? []

        timeline.push({
          label: storeChangeActivity?.name,
          date: new Date(),
          authorName: params?.user?.name,
          authorId: params?.user?._id.toString(),
          comment: `Prescription Approved`, // TODO save change store note and cancel reason here
          statusCode: storeChangeActivity?.statusCode,
          previousStoreId: orderTracking.store,
          userType: user.userType
        })

        const trackingItem: any = await OrderItemTrackingModal.findByIdAndUpdate(orderTrackingId, {
          $set: {
            timeline,
            lastTimelineStatus: storeChangeActivity?.statusCode
          }
        })
        return {
          message: 'Accept order prescription'
        }
      }
      throw new BadRequest('Invalid status')
    } catch (error) {
      throw error
    }
  }

  // This method has to be added to the 'methods' option to make it available to clients
  async update(id: NullableId, data: StoreAdminUsersPrescriptionStatusData, _params?: any): Promise<any> {
    return {
      id: 0,
      ...data
    }
  }

  async patch(id: NullableId, data: StoreAdminUsersPrescriptionStatusPatch, _params?: any): Promise<any> {}

  async remove(id: NullableId, _params?: any): Promise<any> {
    return {
      id: 0,
      text: 'removed'
    }
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
