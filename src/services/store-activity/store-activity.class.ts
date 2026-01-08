// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type {
  StoreActivity,
  StoreActivityData,
  StoreActivityPatch,
  StoreActivityQuery
} from './store-activity.schema'
import { OrderItemTrackingModal } from '../order-item-tracking/order-item-tracking.schema'
import { ObjectId } from 'mongodb'
import { AppDataModel } from '../app-data/app-data.schema'
import { manageProductQuantityFromOrderTrackingId, releaseOrderSoftHold } from '../../utils/inventory'
import { OrderModel } from '../order/order.schema'
import { notificationServices } from '../../socket/namespaceManager'
import { ProductsModel } from '../super-admin/products/products.schema'
import moment from 'moment'
import { OrderItemModel } from '../order-items/order-items.schema'
import { StoreModel } from '../stores/stores.schema'
import {
  cancelLogisticsOrder,
  createItemReturnOrder,
  createLogisticsOrder,
  rescheduleLogisticsPickup
} from '../../utils/logistics'
import { BadRequest } from '@feathersjs/errors'
import { PACKAGE_SPCECS } from '../../constants/general'
import { CONSTANTS as ORDER_ITEM_TRACKING_CONSTANTS } from '../order-item-tracking/order-item-tracking.schema'
import { cancelStoreOrder } from '../order/order.shared'
import { Types } from 'mongoose'
import { StoreInventoryModel } from '../store-inventory/store-inventory.schema'
import Logistics from '../../utils/logistics/Logistics'
import { Shiprocket } from '../../utils/logistics/Shiprocket'
import { trackOrderShipped, trackOrderDelivered, trackReturnProcessed } from '../../analytics/trackers'
import { refundPartialPaymentForItem, refundPaymentForItem } from '../../payments/refund'
import { creditDavaCoinsFromCancelItem, debitDavaCoinsCreditedForMembership } from '../../utils/davaCoins'
import { tryCreditReferralForOrder } from '../../utils/referralValidation'
import { handleDavaCoinsPostDelivered } from '../memberships/utils'

export type { StoreActivity, StoreActivityData, StoreActivityPatch, StoreActivityQuery }

export interface StoreActivityParams extends MongoDBAdapterParams<StoreActivityQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class StoreActivityService<ServiceParams extends Params = StoreActivityParams> extends MongoDBService<
  StoreActivity,
  StoreActivityData,
  StoreActivityParams,
  StoreActivityPatch
> {
  async create(data: any, params?: Params): Promise<any> {
    try {
      const { orderId } = params?.route ?? {}
      const { statusCode, productBatches } = data

      const order = await OrderModel.findById(orderId).lean()

      if (!order) throw new BadRequest('Order not found')

      const orderItemTracking: any = await OrderItemTrackingModal.findById(data.orderItemTrackingId)
        .populate('order')
        .populate('items')
        .lean()

      if (!orderItemTracking) throw new BadRequest('Order tracking details not found')

      const timelineActivities = [...(orderItemTracking?.timeline || []), { ...data, date: new Date() }]
      const lastTimelineStatus = timelineActivities[timelineActivities.length - 1].statusCode

      switch (statusCode) {
        case 'dispatched':
          await this.handleOrderDispatch({ data, productBatches, orderItemTracking, order })
          break
        case 'pickup_rescheduled':
          await this.handlePickupRescheduled(orderItemTracking)
          break
        case 'canceled':
          await this.handleCancelOrderEvent(orderItemTracking, timelineActivities, order)
          break
        case 'return_approved':
          await this.handleReturnApprovedEvent(orderItemTracking, order)
          break

        case 'refund_initiated':
          await this.handleRefundInitiatedEvent(order, orderItemTracking)
          break

        case 'delivered':
          await this.handleDeliveredEvent(order)
          break
        default:
        // console.log('Other status code received!')
      }

      const result = await OrderItemTrackingModal.findByIdAndUpdate(
        data.orderItemTrackingId,
        { timeline: timelineActivities, lastTimelineStatus },
        { new: true }
      )
        .populate('items')
        .lean()

      let image: any = ''
      const items = order.items
      const productId = Array.isArray(items) && items[0]?.productId

      if (productId) {
        const product = await ProductsModel.findById(productId).select('thumbnail').lean()
        image = product?.thumbnail
      }

      notificationServices.userNotifications.sendNotificationToUser(order?.userId?.toString(), {
        recipientId: order?.userId,
        recipientType: 'user',
        title: data?.label,
        message: data?.comment,
        type: 'order',
        data: {
          image,
          price: order?.orderTotal,
          itemsCount: await OrderItemModel.countDocuments({ orderTracking: orderItemTracking?._id }),
          orderId: params?.route?.orderId
        },
        isRead: false,
        createdAt: moment().toDate(),
        priority: 'normal'
      })

      return result
    } catch (error: any) {
      let message = error?.response && error?.response?.data ? error?.response?.data?.message : error.message

      if (error?.response && error?.response?.data && error?.response.data.errors)
        message += '\n' + Object.values(error.response.data.errors).flat().join(',')

      throw new BadRequest(message)
    }
  }

  async handleOrderDispatch({ data, productBatches, orderItemTracking, order }: any) {
    // Batch no validation
    await this.assignProductBatchNo({ productBatches, orderItemTracking })

    const updateData: any = {}
    let packageSpec
    if (data.packageSize === 'small') packageSpec = PACKAGE_SPCECS.SMALL
    else packageSpec = PACKAGE_SPCECS.BIG

    updateData.volume = {
      length: packageSpec.length,
      width: packageSpec.width,
      breadth: packageSpec.breadth
    }
    updateData.weight = packageSpec.weight
    updateData.packageSize = packageSpec.type

    await OrderItemTrackingModal.findByIdAndUpdate(orderItemTracking?._id, { ...updateData })

    if (orderItemTracking.type !== 'order')
      throw new Error('Dispatch activity can not be added for this tracking')

    const dispatchedActivity = orderItemTracking.timeline.find((t: any) => t.statusCode === 'dispatched')
    if (dispatchedActivity) throw new Error('Dispatch activity already added')

    if (process.env.NODE_ENV === 'production') {
      // TODO: remove feature flag
      // if (order?.deliveryMode === 'oneDay' || order?.isDispatchFailed)
      // REMOVE
      if (!order?.skipLogistics) await createLogisticsOrder(orderItemTracking._id.toString())
    }

    // Call after order is dispatched
    await manageProductQuantityFromOrderTrackingId(orderItemTracking._id.toString(), 'remove', productBatches)
    await releaseOrderSoftHold({ orderTrackingId: orderItemTracking._id.toString() })

    // Track event
    await trackOrderShipped({
      orderId: order?.orderId,
      userId: order?.userId?.toString(),
      dateOfOrder: moment(order?.createdAt).format('DD-MM-YYYY HH:mm A'),
      shipmentMode: order?.deliveryMode,
      shippingAddress: order?.address?.fullAddress,
      dateOfDelivery: moment().add(4, 'hours').format('DD-MM-YYYY HH:mm A')
    })
  }

  async handlePickupRescheduled(orderItemTracking: any) {
    if (orderItemTracking.type !== 'order')
      // If cancel or return don't allow
      throw new Error('Pickup Rescheduled activity can not be added for this tracking')

    orderItemTracking.timeline.forEach((e: any) => {
      if (e.statusCode === 'dispatched') throw new Error('Package not dispatched yet!')
      if (e.statusCode === 'picked_up') throw new Error('Package already picked up!')
    })

    if (orderItemTracking.deliveryMode !== 'standard')
      throw new Error('Pickup reschedule not allowed for oneDay delivery mode!')

    if (process.env.NODE_ENV === 'production')
      await rescheduleLogisticsPickup(orderItemTracking._id.toString())
  }

  async handleCancelOrderEvent(orderItemTracking: any, timelineActivities: any[], order: any) {
    if (orderItemTracking.type !== ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.ORDER)
      throw new Error('Can not add this activity in this tracking')

    await cancelStoreOrder(orderItemTracking)

    if (timelineActivities.find((t: any) => t.statusCode === 'dispatched')) {
      if (process.env.NODE_ENV === 'production') {
        // if (order?.deliveryMode === 'oneDay' || order?.isDispatchFailed)
        if (!order?.skipLogistics) await cancelLogisticsOrder(orderItemTracking._id.toString())
      }
    }
  }

  async handleReturnApprovedEvent(orderItemTracking: any, order: any) {
    if (
      ![
        ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.PARTIAL_RETURN,
        ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.RETURN
      ].includes(orderItemTracking.type)
    )
      throw new Error('Can not add this activity in this tracking')

    const refundApprovedActivity = orderItemTracking.timeline.find(
      (t: any) => t.statusCode === 'return_approved'
    )
    if (refundApprovedActivity) throw new Error('Return request already approved')
    // if (process.env.NODE_ENV === 'production') await createItemReturnOrder(orderItemTracking._id.toString())

    if (process.env.NODE_ENV === 'production') {
      // Remove
      if (order?.deliveryMode === 'oneDay' || order?.isDispatchFailed)
        await createItemReturnOrder(orderItemTracking._id.toString())
    }

    const orderItem = orderItemTracking?.items[0]

    if (orderItemTracking.type === ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.PARTIAL_RETURN) {
      await OrderItemModel.updateOne(
        { _id: orderItem?.parentOrderItemId },
        {
          $inc: { quantity: -orderItem?.quantity || 0 }
        }
      )
    }

    // Credit back dava coins if used
    if (orderItem?.davaCoinsUsed && orderItem?.davaCoinsUsed > 0) {
      if (orderItemTracking.type === ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.PARTIAL_RETURN) {
        await OrderItemModel.updateOne(
          { _id: orderItem?.parentOrderItemId },
          {
            $inc: { davaCoinsUsed: -orderItem?.davaCoinsUsed || 0 }
          }
        )
      }

      await creditDavaCoinsFromCancelItem(order, orderItem)
    }

    await debitDavaCoinsCreditedForMembership(order, orderItem)

    // Track Return Approved
    trackReturnProcessed({
      orderId: order?.orderId,
      userId: order?.userId?.toString(),
      productId: orderItem?._id.toString() ?? ''
    })
  }

  async handleRefundInitiatedEvent(order: any, orderItemTracking: any) {
    if (
      ![
        ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.PARTIAL_RETURN,
        ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.RETURN
      ].includes(orderItemTracking.type)
    )
      throw new Error('Refund initiation request declined')

    const refundApprovedActivity = orderItemTracking?.timeline.find(
      (t: any) => t.statusCode === 'return_approved'
    )
    const refundInitiatedActivity = orderItemTracking?.timeline.find(
      (t: any) => t.statusCode === 'refund_initiated'
    )

    if (refundInitiatedActivity) throw new Error('Refund already initiated')
    if (!refundApprovedActivity) throw new Error('Refund must be approved first')

    const orderedItem = orderItemTracking.items[0]

    if (orderItemTracking.type === ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.PARTIAL_RETURN) {
      await refundPartialPaymentForItem(order, orderedItem?._id.toString())
    } else await refundPaymentForItem(order, orderedItem?._id.toString())
  }

  async handleDeliveredEvent(order: any) {
    try {
      await tryCreditReferralForOrder(order?._id?.toString())

      // adjust dava coins if applied and has memberhsip
      await handleDavaCoinsPostDelivered(order)

      // Track Order Delivered
      trackOrderDelivered({
        orderId: order?.orderId,
        userId: order?.userId?.toString(),
        dateOfDelivery: moment().add(4, 'hours').format('DD-MM-YYYY HH:mm A')
      })
    } catch (e) {
      console.log(e)
    }
  }

  async find(params?: any): Promise<any> {
    try {
      // Fetch the previous order tracking data
      const prevData: any = await OrderItemTrackingModal.findById(params.query.orderItemTrackingId).lean()

      // Get the timeline array from the fetched data
      const timelinePrv = prevData?.timeline ?? []

      const prevStoreIds = timelinePrv
        .filter((t: any) => t.statusCode === 'order_transferred_to_another_shop')
        .map((t: any) => t.previousStoreId)

      if (prevStoreIds?.length) {
        const prevStores = await StoreModel.find({ _id: { $in: prevStoreIds } })
          .select('_id storeName')
          .lean()

        for (const store of prevStores) {
          const { _id: storeId, storeName } = store
          const timeline = timelinePrv.find(
            (t: any) =>
              t.statusCode === 'order_transferred_to_another_shop' &&
              t.previousStoreId.toString() === storeId.toString()
          )
          if (timeline) timeline.previousStoreName = storeName
        }
      }

      // Fetch the category items for 'trackOrder'
      const categoryItems = await AppDataModel.find({
        type: 'order-tracking-status',
        visibility: { $in: ['admin', 'consumer'] }
      }).lean()

      // Return the two arrays with different names
      return {
        categoryItemsArray: categoryItems,
        timelineArray: timelinePrv,
        lastTimelineStatus: prevData?.lastTimelineStatus,
        type: prevData?.type
      }
    } catch (error) {
      throw error
    }
  }

  async remove(id: any, params?: any): Promise<any> {
    try {
      // Find the current order tracking data
      const prevData: any = await OrderItemTrackingModal.findOne({
        order: new ObjectId(params?.route?.orderId),
        isDeleted: { $ne: true }
      }).lean()

      // Remove the last element from the timeline
      const updatedTimeline = prevData?.timeline.slice(0, -1)

      // Update the order with the new timeline
      const result = await OrderItemTrackingModal.findOneAndUpdate(
        { order: new ObjectId(params?.route?.orderId), isDeleted: { $ne: true } },
        {
          timeline: updatedTimeline // Save the updated timeline
        },
        { new: true } // Return the updated document
      ).lean()

      return result
    } catch (error) {
      throw error
    }
  }

  async assignProductBatchNo({
    productBatches = [],
    orderItemTracking
  }: {
    productBatches: Array<any>
    orderItemTracking: any
  }) {
    // const orderTracking = await OrderItemTrackingModal.findOne({
    //   store: new Types.ObjectId(storeId),
    //   order: new Types.ObjectId(orderId),
    //   type: 'order'
    // })
    //   .populate('items')
    //   .lean()
    // if (!orderTracking) throw new BadRequest('Order tracking details not available')

    // TODO: FIX
    if (
      orderItemTracking?.items.filter((i: any) => !i.isCancelRequested && !i.isReturnRequested).length !==
      productBatches.length
    )
      throw new BadRequest('Batch no not provided for all products')

    const inventoryFilter = productBatches.reduce((acc: any, curr: any) => {
      acc.push({
        storeId: orderItemTracking?.store,
        productId: new Types.ObjectId(curr.productId),
        'batches.batchNo': curr.batchNo
      })
      return acc
    }, [])

    const inventory = await StoreInventoryModel.find({ $or: inventoryFilter }).lean()

    for (const inv of inventory) {
      const { productId, batches = [] } = inv
      const productBatch = productBatches.find((pb: any) => pb.productId === productId.toString())
      const { batchNo } = productBatch
      const batch = batches.find((b: any) => b.batchNo === batchNo)
      if (!batch) throw new BadRequest(`Invalid batch no ${batchNo} for product id ${productId}`)
    }

    // for (const productBatch of productBatches) {
    // const { batchNo, productId } = productBatch
    // await OrderItemModel.findOneAndUpdate(
    //   { orderTracking: orderTracking._id, product: new Types.ObjectId(productId) },
    //   { batchNo: batchNo }
    // )
    // }

    return {}
  }
}

export class OrderActivitySyncService {
  async create(data: { awbNo: string } | any, params?: Params): Promise<any> {
    const { awbNo, orderTrackingId } = data
    const orderId = params?.route?.orderId

    const orderTracking = await OrderItemTrackingModal.findById(orderTrackingId).select('_id timeline').lean()

    if (!orderTracking) throw new Error('Order item tracking not found!')

    const newRecordsToInsert = await (Logistics.getAggregator('shiprocket') as Shiprocket).syncTrackingData({
      orderId,
      awbNo,
      existingTimeline: (orderTracking?.timeline ?? [])?.filter((t) => t.authorType === 'logistics')
    })

    if (newRecordsToInsert?.length) {
      return await OrderItemTrackingModal.findByIdAndUpdate(orderTracking?._id, {
        $push: { timeline: { $each: newRecordsToInsert } },
        lastTimelineStatus: newRecordsToInsert[newRecordsToInsert.length - 1]?.statusCode
      })
    }

    return {}
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('store-activity'))
  }
}
