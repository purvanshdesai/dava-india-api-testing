import { logger } from '../logger'
import { OrderItemTrackingModal } from '../services/order-item-tracking/order-item-tracking.schema'
import { OrderItemModel } from '../services/order-items/order-items.schema'
import { OrderModel } from '../services/order/order.schema'
import { PaymentModel } from '../services/payment/payment.schema'
import { Types } from 'mongoose'
import { PAYMENT_GATEWAY_MAPPER, PAYMENT_GATEWAYS, PaymentGatewayType } from './'
import { addToRefundPaymentProcessedQueue } from '../jobs/queues/queue'
import { RefundModal } from '../services/refund/refund.schema'

function getGateway(type: PaymentGatewayType) {
  const GatewayClass = PAYMENT_GATEWAY_MAPPER[type]
  return new GatewayClass()
}

export const refundOrderPayment = async (orderId: string): Promise<void> => {
  try {
    const order = await OrderModel.findById(orderId).lean()
    if (!order) throw new Error('Order not found')

    const payment = await PaymentModel.findOne({
      order: order?._id,
      status: 'paid'
    }).lean()

    if (!payment) throw new Error('Payment not found for order: ' + order?._id)

    const paymentGateway = getGateway(order?.paymentMode)

    let opts = { orderId: orderId, type: 'order', paymentFor: 'order' }

    const refundRes = await paymentGateway.refundPayment(payment?.transactionId, payment?.amount ?? 0, opts)

    await OrderModel.findByIdAndUpdate(orderId, { status: 'refund-initiated' })

    if (order.paymentMode === PAYMENT_GATEWAYS.PAYU) {
      await addToRefundPaymentProcessedQueue({
        ...opts,
        status: refundRes?.status,
        amount: payment?.amount,
        transactionId: payment?.transactionId + ':' + refundRes.refundId,
        refundId: refundRes.refundId
      })
    }
  } catch (error) {
    throw error
  }
}

export const refundPaymentForItem = async (order: any, orderItemId: string): Promise<void> => {
  const totalItems = order.items.length ?? 0

  const orderItem = await OrderItemModel.findById(orderItemId).lean()
  if (!orderItem) throw new Error('Order item not found')

  const pastRefunds: { totalRefund: number }[] = await RefundModal.aggregate([
    {
      $match: {
        order: order?._id // match by the `order` field
      }
    },
    {
      $group: {
        _id: '$order', // group by `order` field
        totalRefund: { $sum: '$amount' }
      }
    }
  ])

  const totalPastRefundAmount = pastRefunds[0]?.totalRefund || 0

  let refundAmount: number = 0

  // If there is only one order items, refund full order amount, otherwise refund only single order item amount
  if (totalItems > 1) {
    const orderItemsCountWhichNotCancelled = await OrderItemModel.countDocuments({
      order: order?._id,
      product: order?.items?.map((i: any) => i.productId),
      status: { $nin: ['refunded', 'refund-initiated'] }
    })
    const productDiscount = orderItem?.discountAmount ?? 0

    // If there is only one order item not cancelled, which means other item already cancelled.
    // So refund entire order amount - already cancelled order
    if (orderItemsCountWhichNotCancelled === 1) {
      refundAmount = order?.orderTotal - totalPastRefundAmount / 100
    } else refundAmount = orderItem.quantity * orderItem.amount - productDiscount
  } else if (totalItems === 1) refundAmount = order?.orderTotal - totalPastRefundAmount / 100

  logger.info('Refund amount after cancel: ' + refundAmount)

  const payment = await PaymentModel.findOne({ order: orderItem.order, status: 'paid' }).lean()

  if (!payment) throw new Error('Payment not found for order: ' + order?._id)

  const paymentGateway = getGateway(order?.paymentMode)

  let opts = {
    orderId: orderItem.order.toString(),
    orderItemId: orderItemId,
    type: 'item',
    paymentFor: 'order'
  }

  const refundRes = await paymentGateway.refundPayment(payment?.transactionId, refundAmount, opts)

  await OrderItemModel.findByIdAndUpdate(orderItemId, { status: 'refund-initiated' })

  if (order.paymentMode === PAYMENT_GATEWAYS.PAYU) {
    await addToRefundPaymentProcessedQueue({
      ...opts,
      status: refundRes?.status,
      amount: (refundAmount ?? 0) * 100,
      transactionId: payment?.transactionId + ':' + refundRes.refundId,
      refundId: refundRes.refundId
    })
  }
}

// Edge cases
export const refundPartialPaymentForItem = async (order: any, orderItemId: string): Promise<void> => {
  try {
    const orderItem = await OrderItemModel.findById(orderItemId).lean()
    if (!orderItem) throw new Error('Order item not found')

    const productDiscount = orderItem?.discountAmount ?? 0

    const refundAmount = orderItem.quantity * orderItem.amount - productDiscount

    logger.info('Partial Refund amount after cancel: ' + refundAmount)

    const payment = await PaymentModel.findOne({ order: orderItem.order, status: 'paid' }).lean()

    if (!payment) throw new Error('Payment not found for order: ' + order?._id)

    const paymentGateway = getGateway(order?.paymentMode)

    let opts = {
      orderId: orderItem.order.toString(),
      orderItemId: orderItemId,
      type: 'item',
      paymentFor: 'order'
    }

    const refundRes = await paymentGateway.refundPayment(payment?.transactionId, refundAmount, opts)

    await OrderItemModel.findByIdAndUpdate(orderItemId, { status: 'refund-initiated' })

    if (order.paymentMode === PAYMENT_GATEWAYS.PAYU) {
      await addToRefundPaymentProcessedQueue({
        ...opts,
        status: refundRes?.status,
        amount: (refundAmount ?? 0) * 100,
        transactionId: payment?.transactionId + ':' + refundRes.refundId,
        refundId: refundRes.refundId,
        isPartialCancel: true
      })
    }
  } catch (e) {
    console.log(e)
    throw e
  }
}

export const refundPaymentForStore = async ({
  orderItemTrackingId,
  canceledItems,
  refundAmount,
  order
}: {
  orderItemTrackingId: string
  canceledItems: string[]
  refundAmount: number
  order: any
}) => {
  const orderItemTracking = await OrderItemTrackingModal.findById(orderItemTrackingId).lean()
  if (!orderItemTracking) throw new Error('Order item tracking not found')

  const payment = await PaymentModel.findOne({ order: orderItemTracking.order, status: 'paid' }).lean()

  if (!payment) throw new Error('Payment not found for order')

  const paymentGateway = getGateway(order?.paymentMode)

  let opts = {
    orderId: orderItemTracking.order.toString(),
    orderItemsId: canceledItems.join(','),
    type: 'store',
    paymentFor: 'order'
  }

  logger.info('Refund amount after cancel: ' + refundAmount)

  const refundRes = await paymentGateway.refundPayment(payment?.transactionId, refundAmount, opts)

  await OrderItemModel.updateMany(
    { _id: { $in: canceledItems.map((id) => new Types.ObjectId(id)) } },
    { status: 'refund-initiated' }
  )

  if (order.paymentMode === PAYMENT_GATEWAYS.PAYU) {
    await addToRefundPaymentProcessedQueue({
      ...opts,
      status: refundRes?.status,
      amount: (refundAmount ?? 0) * 100,
      transactionId: payment?.transactionId + ':' + refundRes.refundId,
      refundId: refundRes.refundId
    })
  }
}
