import { AppDataModel, CONSTANTS } from '../services/app-data/app-data.schema'
import { MembershipOrderModel } from '../services/membership-orders/membership-orders.schema'
import { OrderItemTrackingModal } from '../services/order-item-tracking/order-item-tracking.schema'
import { OrderItemModel } from '../services/order-items/order-items.schema'
import {
  CheckoutSessionModel,
  ORDER_STATUS,
  OrderModel,
  PAYMENT_STATUS
} from '../services/order/order.schema'
import { RefundModal } from '../services/refund/refund.schema'
import { CONSTANTS as ORDER_ITEM_TRACKING_CONSTANTS } from '../services/order-item-tracking/order-item-tracking.schema'
import { Types } from 'mongoose'
import { PaymentModel } from '../services/payment/payment.schema'
import { BadRequest } from '@feathersjs/errors'
import {
  handleDebitDavaCoinsOnSuccessfulPayment,
  handleMembershipSubscriptionFromOrder,
  issueDavaOneMembership
} from '../services/memberships/utils'
import moment from 'moment'
import { SOCKET_CONST } from '../constants/socket'
import { app } from '../app'
import { StoreAdminUserModal } from '../services/store-admin-users/store-admin-users.schema'
import { notificationServices } from '../socket/namespaceManager'
import { releaseSoftHoldQuantity, softHoldForOrder } from '../utils/inventory'
import { CouponUsagesModel } from '../services/coupon-usages/coupon-usages.schema'
import { CouponsModel } from '../services/coupons/coupons.schema'
import { ProductsModel } from '../services/super-admin/products/products.schema'
import { createConsumerTicket } from '../services/tickets/tickets.class'
import { generateRunningOrderId } from '../services/order/order.shared'
import { PaymentResponse } from './PaymentType'
import { addToOrderForPrescriptionQueue, addToOrderProcessingQueue } from '../jobs/queues/queue'
import { MembershipModel } from '../services/memberships/memberships.schema'
import { trackOrderViaPostBack } from './external'
import { SMSUtility } from '../utils/SMSUtility'
import { logger, paymentTrackerLogger } from '../logger'
import { appEnv, appEnvironments } from '../utils/config'
import { getPaymentGateway } from '../services/payment/payment.shared'
import { PAYMENT_GATEWAYS } from '.'
import { PayUPaymentGateway } from './payu/PayuGateway'

export const onPaymentCaptured = async (data: PaymentResponse): Promise<void> => {
  if (data?.paymentFor === 'membership') {
    await onSaveMembershipPayment(data)
    return
  }

  await savePayment(data)
}

export const onPaymentRefundProcessed = async (data: PaymentResponse): Promise<void> => {
  if (data.paymentFor === 'membership') await onMembershipPaymentRefundProcessed(data)
  else await onRefundProcessed(data)
}

export const onPaymentFailed = async (data: PaymentResponse): Promise<any> => {
  if (data.paymentFor === 'membership') await onSaveMembershipPayment(data)
  else await savePayment(data)

  await onPaymentFailure(data)
}

const onPaymentFailure = async (data: PaymentResponse): Promise<void> => {
  try {
    await app.io.to(data?.userSocketId).emit(SOCKET_CONST.PAYMENT_STATUS, { status: 'fail' })
  } catch (error) {
    throw error
  }
}

const onRefundProcessed = async (data: PaymentResponse): Promise<void> => {
  try {
    const { orderId, orderItemId, type, isPartialCancel } = data
    const order = await OrderModel.findById(orderId).lean()

    if (!order) throw new Error('Order not found')

    await RefundModal.create({
      amount: data?.amount,
      currency: data?.currency ?? 'INR',
      order: order?._id,
      orderItemId: orderItemId,
      paymentGateway: order.paymentMode,
      paymentFor: 'order',
      paymentId: data?.transactionId,
      refundId: data?.refundId,
      status: data?.status,
      refundResponse: data
    })

    const refundedActivity = await AppDataModel.findOne({ statusCode: 'refund_completed' }).lean()
    const refundedTrackingActivity = {
      date: new Date(),
      statusCode: 'refund_completed',
      label: refundedActivity?.name
    }

    const changeOrderStatus = async () => {
      await OrderModel.findByIdAndUpdate(order?._id, {
        status: 'refunded'
      })
    }

    if (type === 'order') {
      await changeOrderStatus()

      await OrderItemTrackingModal.updateMany(
        {
          order: order?._id,
          type: {
            $in: [
              ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.RETURN,
              ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.CANCEL
            ]
          },
          isDeleted: { $ne: true }
        },
        {
          $push: { timeline: refundedTrackingActivity },
          $set: { lastTimelineStatus: 'refund_completed' }
        }
      )
    } else if (type === 'item') {
      await OrderItemModel.findByIdAndUpdate(orderItemId, { status: 'refunded' })

      let itemTracking

      if (isPartialCancel) {
        itemTracking = await OrderItemTrackingModal.findOne({
          type: {
            $in: [
              ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.PARTIAL_CANCEL,
              ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.PARTIAL_RETURN
            ]
          },
          items: new Types.ObjectId(orderItemId),
          isDeleted: { $ne: true }
        })
          .sort({ _id: 1 })
          .lean()
      } else {
        itemTracking = await OrderItemTrackingModal.findOne({
          type: {
            $in: [
              ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.RETURN,
              ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.CANCEL
            ]
          },
          items: new Types.ObjectId(orderItemId),
          isDeleted: { $ne: true }
        }).lean()
      }

      if (itemTracking)
        await OrderItemTrackingModal.findByIdAndUpdate(itemTracking._id, {
          $push: { timeline: refundedTrackingActivity },
          $set: { lastTimelineStatus: 'refund_completed' }
        })

      // Change order status to refunded if all items refunded
      const totalItemsInOrder = await OrderItemModel.countDocuments({
        order: order?._id,
        status: 'refunded',
        isReturnQtyModified: { $ne: true }
      })

      if (totalItemsInOrder === order?.items?.length && !isPartialCancel) await changeOrderStatus()
    } else if (type === 'store') {
      const orderItemsId = data?.orderItemsId ? data?.orderItemsId.split(',') : []
      await OrderItemModel.updateMany(
        { _id: { $in: orderItemsId.map((id: string) => new Types.ObjectId(id)) } },
        { status: 'refunded' }
      )

      const itemTracking: any = await OrderItemTrackingModal.findOne({
        type: {
          $in: [
            ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.RETURN,
            ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.CANCEL
          ]
        },
        items: {
          $all: orderItemsId.map((id: string) => new Types.ObjectId(id)),
          $size: orderItemsId.length
        },
        isDeleted: { $ne: true }
      }).lean()

      if (itemTracking)
        await OrderItemTrackingModal.findByIdAndUpdate(itemTracking._id, {
          $push: { timeline: refundedTrackingActivity },
          $set: { lastTimelineStatus: 'refund_completed' }
        })

      // Change order status to refunded if all items refunded
      const totalItemsInOrder = await OrderItemModel.countDocuments({
        order: order?._id,
        status: 'refunded'
      })

      if (totalItemsInOrder === order?.items?.length) await changeOrderStatus()
    }
  } catch (error) {
    throw error
  }
}

const savePayment = async (data: PaymentResponse): Promise<void> => {
  try {
    const order = await OrderModel.findOne({ _id: data?.orderId }).lean()

    if (!order) throw new BadRequest('Order record not found')

    const payment = await PaymentModel.findOne({
      order: order?._id,
      paymentOrderId: data.paymentOrderId
    }).lean()

    if (!payment) throw new BadRequest('Payment record not found')

    if (payment?.status === 'paid') return

    await PaymentModel.findOneAndUpdate(payment._id, {
      status:
        data?.status == PAYMENT_STATUS.CAPTURED
          ? ORDER_STATUS.PAID
          : data?.paymentStatus === PAYMENT_STATUS.USER_CANCELLED
            ? ORDER_STATUS.PAYMENT_CANCELED_BY_USER
            : ORDER_STATUS.FAILED,
      paymentResponse: data,
      transactionId: data?.transactionId
    })

    let opts = {}

    if (order && order?.orderId && order?.orderId.toLowerCase().startsWith('p')) {
      opts = { orderId: await generateRunningOrderId() }
    }

    // console.log('payment res ==== ', paymentRes)
    await OrderModel.updateOne(
      { paymentOrderId: data?.paymentOrderId },
      {
        status:
          data?.status == PAYMENT_STATUS.CAPTURED
            ? ORDER_STATUS.PAID
            : data?.paymentStatus === PAYMENT_STATUS.USER_CANCELLED
              ? ORDER_STATUS.PAYMENT_CANCELED_BY_USER
              : ORDER_STATUS.FAILED,
        ...opts
      }
    )

    if (data?.status == 'captured') await onPaymentSuccess(data)
  } catch (error) {
    console.log(error)
    throw error
  }
}

const onPaymentSuccess = async (data: PaymentResponse): Promise<void> => {
  try {
    const orderIdObj = new Types.ObjectId(data.orderId)

    const checkoutSession = await CheckoutSessionModel.findOne({
      orderId: orderIdObj
    }).lean()

    if (!checkoutSession) {
      logger.error('Invalid checkout session', { orderId: data.orderId })
      throw new BadRequest('Invalid checkout session')
    }

    if (moment().isAfter(checkoutSession.sessionEndTime)) {
      await OrderModel.updateOne({ _id: orderIdObj }, { isSessionFailedOrder: true })
      logger.warn('Checkout session expired', { orderId: data.orderId })
      throw new BadRequest('Checkout session expired')
    }

    // find order and populate user (only fields we need)
    const order: any = await OrderModel.findOne({ _id: orderIdObj })
      .populate({ path: 'userId', select: '_id name phoneNumber davaoneMembership referral' })
      .lean()


    if (!order) {
      logger.error('Order not found', { orderId: data.orderId })
      throw new BadRequest('Order not found')
    }

    // store paymentOrderId
    await OrderModel.findByIdAndUpdate(order._id, { paymentOrderId: data.paymentOrderId })

    // notify socket if provided
    if (data.userSocketId) {
      try {
        app.io.to(data.userSocketId).emit(SOCKET_CONST.PAYMENT_STATUS, { status: 'success' })
      } catch (e) {
        logger.warn('Socket emit failed', e)
      }
    }

    // group checkout session items by store
    const items = checkoutSession.items || []
    const storeWiseItems = items.reduce<Record<string, any[]>>((acc, curr) => {
      const storeId = curr.storeId?.toString() ?? 'unknown'
      if (!acc[storeId]) acc[storeId] = []
      acc[storeId].push(curr)
      return acc
    }, {})

    const storeEntries = Object.entries(storeWiseItems)

    // process each store. We'll run stores in parallel but each store's internal steps are ordered.
    await Promise.all(
      storeEntries.map(async ([storeId, storeItems], index) => {
        // find order items for this store
        const productIds = (storeItems as any[]).map((si) => si.productId).filter(Boolean)
        if (!productIds.length) return

        const orderItems = await OrderItemModel.find({
          order: order._id,
          product: { $in: productIds }
        }).lean()

        // create tracking record
        const orderItemTrackingDoc = await OrderItemTrackingModal.create({
          type: ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.ORDER,
          items: orderItems.map((oi: any) => oi._id),
          order: order._id,
          status: 'pending',
          store: storeId,
          timeline: [],
          deliveryMode: order.deliveryMode ?? 'standard',
          hasPrescriptionVerification: orderItems.some((oi: any) => oi.isPrescriptionRequired),
          splitTrackingId: `${index + 1}`
        })
        const orderItemTracking = orderItemTrackingDoc.toObject()

        // notify store admins in parallel (fire-and-forget but we await to catch problems)
        const storeAdmins = await StoreAdminUserModal.find({ storeIds: storeId }).lean()
        await Promise.allSettled(
          storeAdmins.map((user) =>
            notificationServices.adminNotifications.sendNotificationToUser(user._id.toString(), {
              recipientId: user._id,
              recipientType: 'admin',
              title: 'Order Placed',
              message: 'an order has been placed by user',
              type: 'order',
              data: {},
              isRead: false,
              createdAt: moment().toDate(),
              priority: 'normal'
            })
          )
        )

        // bulk update order items to set orderTracking
        if (orderItems.length) {
          const bulkOps = orderItems.map((oi: any) => ({
            updateOne: {
              filter: { _id: oi._id },
              update: { $set: { orderTracking: orderItemTracking._id } }
            }
          }))
          await OrderItemModel.bulkWrite(bulkOps)
        }

        // perform soft hold for this tracking
        await softHoldForOrder({ orderTrackingId: orderItemTracking._id })
      })
    )

    // release any remaining soft hold quantities for the order
    await releaseSoftHoldQuantity(order._id.toString())

    // add "order placed" timeline entry to each tracking that doesn't already have it
    const orderPlacedActivity = await AppDataModel.findOne({
      type: CONSTANTS.TYPE.TRACKING_STATUS,
      statusCode: 'order_placed'
    }).lean()

    const trackingDetails = await OrderItemTrackingModal.find({ order: order._id, isDeleted: { $ne: true } })
      .populate({ path: 'items', populate: { path: 'product' } })
      .lean()

    await Promise.all(
      trackingDetails.map(async (tracking: any) => {
        const timeline = tracking.timeline ?? []
        const already = timeline.some((t: any) => t.statusCode === orderPlacedActivity?.statusCode)
        if (already) return

        timeline.push({
          authorType: 'user',
          authorId: order.userId?._id,
          authorName: order.userId?.name,
          label: orderPlacedActivity?.name,
          date: new Date(),
          statusCode: orderPlacedActivity?.statusCode
        })

        await OrderItemTrackingModal.findByIdAndUpdate(tracking._id, {
          timeline,
          lastTimelineStatus: orderPlacedActivity?.statusCode
        })

        await addToOrderProcessingQueue({
          orderId: order._id,
          trackingId: tracking._id,
          statusToSet: 'order_under_verification'
        })
      })
    )

    // coupon usage
    if (order.couponCode) {
      const coupon = await CouponsModel.findOne({
        couponCode: { $regex: new RegExp(`^${order.couponCode}$`, 'i') },
        archive: false
      }).lean()
      if (coupon) {
        await CouponUsagesModel.create({
          customerId: order.userId?._id,
          couponId: coupon._id,
          orderId: order._id,
          createdAt: new Date()
        })
      }
    }

    // membership free delivery reduce by 1
    if (order.hasMembershipFreeDeliveryBenefit && order.userId?.davaoneMembership) {
      await MembershipModel.updateOne(
        { _id: order.userId.davaoneMembership },
        { $inc: { freeDeliveryBalance: -1 } }
      )
    }

    // adjust dava coins if applied
    if (order.isDavaCoinsApplied) {
      await handleDebitDavaCoinsOnSuccessfulPayment(order)
    }

    // mark checkout session inactive
    await CheckoutSessionModel.findByIdAndUpdate(checkoutSession._id, { status: 'inactive' })

    // create consultation ticket if needed
    if (order.consultDoctorForPrescription) {
      // find products that require prescription
      const prescriptionRequiredItems = await ProductsModel.find({
        _id: { $in: order.items?.map((i: any) => i.productId) ?? [] },
        prescriptionReq: true
      })
        .select('_id')
        .lean()

      const itemsForTicket = prescriptionRequiredItems.map((i: any) => {
        const found = order.items?.find((oi: any) => oi.productId.toString() === i._id.toString())
        return {
          productId: i._id,
          quantity: found?.quantity || 1
        }
      })

      const trackingForPrescription = trackingDetails
        .filter((tracking: any) => tracking.items?.some((item: any) => item.product?.prescriptionReq))
        .map((t: any) => t._id)

      await createConsumerTicket({
        order: order._id.toString(),
        userId: order.userId?._id?.toString(),
        issue: 'doctor-consultation',
        comment: 'Created after by system payment confirmation',
        items: itemsForTicket ?? [],
        address: '',
        prescription_url: '',
        patientId: order.patientId,
        dateOfConsult: order.dateOfConsult,
        timeOfConsult: order.timeOfConsult,
        phoneNumber: order.phoneNumber ?? order.address?.phoneNumber
      })

      await addToOrderForPrescriptionQueue({
        orderId: order._id,
        trackingIds: trackingForPrescription
      })
    }

    // create davaone membership if included
    if (order.isDavaOneMembershipAdded && order.davaOneMembershipAmount > 0) {
      await handleMembershipSubscriptionFromOrder({ ...order, userId: order?.userId?._id })
    }

    // track via postback (utm/affiliate)
    await trackOrderViaPostBack(order)

    if (appEnv !== appEnvironments.LOCAL) {
      // final: send SMS
      try {
        const smsUtility = new SMSUtility()
        await smsUtility.sendSMS({
          mobileNo: order.userId?.phoneNumber?.replace('+91', ''),
          templateName: 'order_placed',
          params: { orderId: order.orderId }
        })
      } catch (smsErr) {
        logger.warn('Failed to send order placed SMS', smsErr)
      }
    }

    // optional: await session.commitTransaction(); session.endSession()
  } catch (err) {
    logger.error('onPaymentSuccess failed', err)
    // optional: if using session -> await session.abortTransaction(); session.endSession()
    throw err
  }
}

const onSaveMembershipPayment = async (data: PaymentResponse): Promise<boolean> => {
  try {
    const order = await MembershipOrderModel.findOne({ _id: data?.orderId }).lean()
    const payment = await PaymentModel.findOne({
      membershipOrder: order?._id,
      paymentOrderId: data.paymentOrderId
    }).lean()

    if (!payment) throw new BadRequest('Payment record not found')

    await PaymentModel.findOneAndUpdate(payment._id, {
      status: data?.status == 'captured' ? 'paid' : 'failed',
      paymentResponse: data,
      transactionId: data?.transactionId
    })

    const mOrder = await MembershipOrderModel.findByIdAndUpdate(
      order?._id,
      { status: data?.status == 'captured' ? 'paid' : 'failed' },
      { returnDocument: 'after' }
    ).lean()

    if (mOrder?.status === 'paid') {
      // Once Payment is updated, Create membership record
      await issueDavaOneMembership(order)
    }

    return true
  } catch (error) {
    throw error
  }
}

const onMembershipPaymentRefundProcessed = async (data: PaymentResponse): Promise<void> => {
  try {
    const order = await MembershipOrderModel.findOne({ _id: data.orderId }).lean()

    if (!order) throw new Error('Membership Order not found')

    await RefundModal.create({
      amount: data?.amount,
      currency: data?.currency,
      membershipOrder: order?._id,
      paymentGateway: 'razorpay',
      paymentFor: 'membership',
      paymentId: data?.payment_id,
      refundId: data?.id,
      status: data?.status,
      refundResponse: data
    })

    await MembershipOrderModel.findByIdAndUpdate(order?._id, {
      status: 'refunded'
    })
  } catch (error) {
    throw error
  }
}

export const checkPaymentStatusAfterCheckoutSessionEnd = async (orderId: string): Promise<void> => {
  try {
    // fetch order as plain object (lean())
    const order = await OrderModel.findById(orderId).lean()

    // ensure order exists
    if (!order) throw new BadRequest('Order record not found')

    // if already marked paid — nothing to do
    if (order?.status === ORDER_STATUS.PAID) return

    // get configured payment gateway (hard-coded to PAYU here)
    const paymentGateway = getPaymentGateway(PAYMENT_GATEWAYS.PAYU) as PayUPaymentGateway

    // verify payment with gateway using txnid from order
    const paymentRes = await paymentGateway?.verifyPayment({ txnid: order?.paymentOrderId })

    const logEntry = {
      orderId,
      paymentReferenceId: paymentRes?.mihpayid,
      txnid: order?.paymentOrderId,
      paymentGatewayPaymentStatus: paymentRes?.status,
      orderStatus: order?.status
    }
    console.log('🚀 ~ checkPaymentStatusAfterCheckoutSessionEnd ~ logEntry:', logEntry)

    // If gateway says success and our order was pending/failed, we simply log for now.
    if (
      paymentRes?.status?.toLowerCase() === 'success' &&
      [ORDER_STATUS.PENDING, ORDER_STATUS.FAILED].includes(order.status)
    ) {
      console.log('🚀 ~ Triggering Auto Refund =====>')
      // Payment captured at gateway but DIA order status is pending/failed
      paymentTrackerLogger.info(
        `Order Failed Payment Logs: Payment Captured at Payu but DIA order status is ${order?.status}: ${JSON.stringify(logEntry, null, 2)}`
      )
      // Trigger auto refund
      await paymentGateway.refundPayment(paymentRes?.mihpayid, order?.orderTotal)

      const orderItems = await OrderItemModel.find({ order: order?._id })
        .select('_id suggestedStoreId')
        .lean()

      const activities = await AppDataModel.find({
        type: 'order-tracking-status',
        statusCode: { $in: ['refund_initiated', 'refund_completed', 'canceled', 'order_placed'] }
      }).lean()

      const refundInitiatedActivity = activities.find((a: any) => a.statusCode === 'refund_initiated')
      const refundProcessedActivity = activities.find((a: any) => a.statusCode === 'refund_completed')
      const cancelledActivity = activities.find((a: any) => a.statusCode === 'canceled')
      const orderPlacedActivity = activities.find((a: any) => a.statusCode === 'order_placed')

      await OrderModel.updateOne({ _id: order?._id }, { status: ORDER_STATUS.REFUNDED })

      const storeId = orderItems[0]?.suggestedStoreId ?? null

      // create tracking record
      const tracking = (
        await OrderItemTrackingModal.create({
          type: ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.CANCEL,
          items: orderItems.map((oi: any) => oi._id),
          order: order._id,
          store: storeId,
          timeline: [
            {
              statusCode: orderPlacedActivity?.statusCode,
              label: orderPlacedActivity?.name,
              date: order?.createdAt
            },
            {
              statusCode: cancelledActivity?.statusCode,
              label: cancelledActivity?.name,
              date: new Date()
            },
            {
              statusCode: refundInitiatedActivity?.statusCode,
              label: refundInitiatedActivity?.name,
              date: new Date()
            },
            {
              statusCode: refundProcessedActivity?.statusCode,
              label: refundProcessedActivity?.name,
              date: new Date()
            }
          ],
          deliveryMode: order.deliveryMode,
          lastTimelineStatus: refundProcessedActivity?.statusCode
        })
      ).toObject()

      await OrderItemModel.updateMany(
        { order: order?._id },
        { orderTracking: tracking?._id, isCancelRequested: true }
      )
    } else {
      paymentTrackerLogger.info(`Order Failed Payment Logs: ${JSON.stringify(logEntry, null, 2)}`)
    }
  } catch (e) {
    console.log(e)
  }
}
