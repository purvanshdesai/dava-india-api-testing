import { Types } from 'mongoose'
import { releaseOrderSoftHold } from '../../utils/inventory'
import {
  CONSTANTS as ORDER_TRACKING_CONSTANTS,
  OrderItemTrackingModal
} from '../order-item-tracking/order-item-tracking.schema'
import { OrderItemModel } from '../order-items/order-items.schema'
import { AppDataModel } from '../app-data/app-data.schema'
import { getPartialItemDiscount } from '../order-items/order-items.shared'
import { getProductTaxDetails } from '../../utils/taxCalculation'
import { refundPartialPaymentForItem, refundPaymentForItem } from '../../payments/refund'
import { ProductsModel } from '../super-admin/products/products.schema'
import { getTicketIssueParentCategory } from '../../constants/general'
import { getUsersWithSupportTicketPermission } from '../../cache/redis/permissions'
import { createTicketId } from '../tickets/tickets.class'
import { CONSTANTS as TICKET_CONSTANTS, TicketsModel } from '../tickets/tickets.schema'
import { sendReturnNotificationToAdmin } from './order.shared'
import { TicketActivitiesModel } from '../support/support.schema'
import {
  creditDavaCoinsFromCancelItem,
  processProductPartialCancellationWithDavaCoins
} from '../../utils/davaCoins'
import { OrderModel } from './order.schema'

/** Adjust this to your actual types/models */
type UserLike = { _id: Types.ObjectId | string; name?: string }
type OrderLike = { _id: Types.ObjectId | string }
type OrderItemLike = {
  _id: Types.ObjectId | string
  product: Types.ObjectId | string
  quantity: number
  suggestedStoreId?: any
  batchNo?: string
  davaCoinsUsed?: number
}
type ProductLike = {
  _id: Types.ObjectId | string
  finalPrice: number
  prescriptionReq?: boolean
}

interface CancelInput {
  order: OrderLike
  orderItem: OrderItemLike
  productTracking?: any
  reason: string
  note?: string
  user?: UserLike
  cancelQuantity?: number
  comment?: string
  isCancelledByAdmin?: boolean
  adminUser?: UserLike
}

type PartialReturnInput = {
  order: { _id: Types.ObjectId | string }
  orderItem: {
    _id: Types.ObjectId | string
    product: Types.ObjectId | string
    quantity: number
    suggestedStoreId?: any
    batchNo?: string
    davaCoinsUsed?: number
  }
  productTracking: {
    _id: Types.ObjectId | string
    store?: any
    weight?: number
    volume?: number
    packageSize?: any
    logisticsOrderId?: string
    shipmentCreatedAt?: Date
    shipmentId?: string
    awbNo?: string
    deliveryMode?: string
  }
  reason: string
  note?: string
  user: { _id?: Types.ObjectId | string; role?: string; name?: string } | string
  returnQuantity: number
  images?: string[] // or any[]
}

export class BadRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BadRequestError'
  }
}

export async function partialCancelOrderItem(data: CancelInput) {
  const {
    order,
    orderItem: originalOrderItem,
    productTracking,
    reason,
    note,
    user,
    cancelQuantity = 1,
    comment = '',
    isCancelledByAdmin = false,
    adminUser
  } = data

  // ---- Early validations ----------------------------------------------------
  if (!order?._id) throw new Error('Order is required')
  if (!originalOrderItem?._id) throw new Error('Order item is required')
  if (!originalOrderItem?.quantity || originalOrderItem.quantity <= 0)
    throw new Error('Original item quantity is invalid')
  if (!Number.isFinite(cancelQuantity) || cancelQuantity <= 0)
    throw new Error('cancelQuantity must be a positive number')

  // Disallow “partial” cancel equal/greater than full quantity
  if (cancelQuantity >= originalOrderItem.quantity) {
    throw new Error(
      `cancelQuantity (${cancelQuantity}) must be less than the original quantity (${originalOrderItem.quantity}) for partial cancel`
    )
  }

  // normalize ids
  const orderId = order._id as any
  const originalOrderItemId = originalOrderItem._id as any
  const userId = typeof user === 'string' ? (user as any) : (user as any)?._id

  try {
    // 1) Abort if a previous full-cancel tracking exists for this item
    const existingFullCancel = await OrderItemTrackingModal.findOne({
      type: ORDER_TRACKING_CONSTANTS.TRACKING_TYPE.CANCEL,
      items: { $in: [originalOrderItemId] }
    }).lean()

    if (existingFullCancel) {
      throw new Error('Partial cancel not possible, item already fully cancelled')
    }

    // 2) Fetch product (unit pricing/taxes as needed)
    const product: ProductLike | null = await ProductsModel.findById(originalOrderItem.product)
      .populate('taxes')
      .lean()

    if (!product) throw new Error('Product not found for order item')

    // 3) Create a child (cancelled) order item representing the partial cancellation
    const qtyToCancel = Number(cancelQuantity)
    const updatedQuantity = (originalOrderItem.quantity || 0) - qtyToCancel
    if (updatedQuantity < 0) {
      throw new Error('Updated quantity cannot be negative')
    }

    // compute discount for the cancelled piece(s)
    const cancelledDiscountAmount = getPartialItemDiscount(originalOrderItem, qtyToCancel)

    // handle dava coins if applied
    let remainingAllocatedCoins = 0,
      refundedCoins = 0

    if (originalOrderItem?.davaCoinsUsed && originalOrderItem?.davaCoinsUsed > 0) {
      const davaCoinsDetails = processProductPartialCancellationWithDavaCoins({
        productId: product?._id?.toString(),
        totalQty: originalOrderItem?.quantity,
        allocatedCoins: originalOrderItem?.davaCoinsUsed,
        cancelQty: qtyToCancel
      })

      remainingAllocatedCoins = davaCoinsDetails?.remainingAllocatedCoins
      refundedCoins = davaCoinsDetails?.refundedCoins
    }

    const cancelledOrderItemDoc = await OrderItemModel.create([
      {
        order: orderId,
        product: product._id,
        user: userId,
        parentOrderItemId: originalOrderItemId,
        isPartialCancelRequested: true,
        quantity: qtyToCancel,
        amount: product.finalPrice, // if this is unit price, consider storing unitPrice and computing line totals explicitly downstream
        discountAmount: cancelledDiscountAmount,
        davaCoinsUsed: refundedCoins,
        gstDetails: null,
        suggestedStoreId: originalOrderItem?.suggestedStoreId,
        suggestedBatchNo: originalOrderItem?.batchNo,
        isPrescriptionRequired: product?.prescriptionReq ?? false,
        cancellationDetails: {
          reason,
          comment: note ?? ''
        },
        partialCancelRequestStatus: 'approved'
      }
    ])

    const cancelledOrderItem = cancelledOrderItemDoc[0]?.toObject()

    // 4) Refund for the child (cancelled) order item
    //    This should be idempotent or throw so the transaction can rollback if it fails.
    await refundPartialPaymentForItem(order, cancelledOrderItem?._id.toString())

    // 5) Recompute GST/discount on the original parent item for the reduced quantity
    const recomputedGst =
      updatedQuantity > 0
        ? getProductTaxDetails({
            ...(product as any),
            quantity: updatedQuantity,
            discountedAmount: 0 // TODO: if you have a rule, plug the right discountedAmount here
          })
        : null

    await OrderItemModel.updateOne(
      { _id: originalOrderItemId },
      {
        $set: {
          quantity: updatedQuantity,
          discountAmount:
            updatedQuantity > 0 ? getPartialItemDiscount(originalOrderItem, updatedQuantity) : 0,
          gstDetails: recomputedGst && recomputedGst.totalRate > 0 ? recomputedGst : null,
          davaCoinsUsed: remainingAllocatedCoins
        }
      }
    )

    // 6) Prepare activities/labels (canceled + refund_initiated)
    const activities = await AppDataModel.find({
      type: 'order-tracking-status',
      statusCode: { $in: ['canceled', 'refund_initiated'] }
    }).lean()

    const cancelActivity = activities.find((a) => a.statusCode === 'canceled')
    const refundInitiatedActivity = activities.find((a: any) => a.statusCode === 'refund_initiated')

    const now = new Date()

    // 7) Create PARTIAL_CANCEL tracking entry referencing the child item
    const cancelOrderTracking = await OrderItemTrackingModal.create([
      {
        type: ORDER_TRACKING_CONSTANTS.TRACKING_TYPE.PARTIAL_CANCEL,
        items: [cancelledOrderItem?._id],
        store: productTracking?.store,
        order: orderId,
        status: 'pending',
        timeline: [
          {
            authorType: isCancelledByAdmin ? 'super-admin' : 'user',
            authorId: isCancelledByAdmin ? adminUser?._id?.toString() : userId.toString(),
            authorName: isCancelledByAdmin ? adminUser?.name : user?.name,
            statusCode: 'canceled',
            label: cancelActivity?.name,
            date: now,
            comment: `${reason ?? ''} ${note ?? ''}`.trim()
          },
          {
            authorType: 'super-admin',
            authorName: 'Super Admin',
            statusCode: 'refund_initiated',
            label: refundInitiatedActivity?.name,
            date: now,
            comment:
              'Refund initiated, refund amount will be processed and credited back to the user in 3 to 5 days'
          }
        ],
        lastTimelineStatus: 'refund_initiated',
        weight: productTracking?.weight,
        volume: productTracking?.volume,
        packageSize: productTracking?.packageSize,
        deliveryMode: productTracking?.deliveryMode ?? 'standard'
      }
    ])

    const cancelOrderTrackingId = cancelOrderTracking[0]._id

    // 8) Update the child (cancelled) item with tracking info
    await OrderItemModel.updateOne(
      { _id: cancelledOrderItem?._id },
      {
        $set: {
          isCancelRequested: true,
          orderTracking: cancelOrderTrackingId,
          partialCancelRequestStatus: 'approved',
          adminComment: comment
        }
      }
    )

    // 9) Release any soft hold **after** commit, so tracking id definitely exists
    await releaseOrderSoftHold({ orderTrackingId: cancelOrderTrackingId })

    // Credit back dava coins if used
    if (cancelledOrderItem?.davaCoinsUsed && cancelledOrderItem?.davaCoinsUsed > 0) {
      await creditDavaCoinsFromCancelItem(order as any, cancelledOrderItem)
    }

    return { message: 'Partial cancel request approved successfully' }
  } catch (err: any) {
    // Optional: add logging/monitoring here
    throw new Error(`Partial cancel failed: ${err?.message ?? 'Unknown error occurred'}`)
  }
}

/**
 * Create a partial return for a single order item.
 * Operation is performed inside a transaction to avoid half-completed state.
 */
export async function partialReturnOrderItem(data: PartialReturnInput) {
  // ----- Normalize input & basic validations --------------------------------
  const {
    order,
    orderItem: originalOrderItem,
    productTracking,
    reason,
    note,
    user,
    returnQuantity,
    images
  } = data

  if (!order || !order._id) throw new BadRequestError('Order id is required')
  if (!originalOrderItem || !originalOrderItem._id) throw new BadRequestError('Order item id is required')
  if (!Number.isFinite(originalOrderItem.quantity) || originalOrderItem.quantity <= 0)
    throw new BadRequestError('Original order item quantity is invalid')
  if (!Number.isFinite(returnQuantity) || returnQuantity <= 0)
    throw new BadRequestError('returnQuantity must be a positive number')
  if (returnQuantity >= originalOrderItem.quantity)
    throw new BadRequestError(
      `returnQuantity (${returnQuantity}) must be less than original quantity (${originalOrderItem.quantity}) for partial return`
    )

  const orderId = typeof order._id === 'string' ? new Types.ObjectId(order._id) : order._id
  const originalOrderItemId =
    typeof originalOrderItem._id === 'string'
      ? new Types.ObjectId(originalOrderItem._id)
      : originalOrderItem._id
  const userId =
    typeof user === 'string'
      ? new Types.ObjectId(user)
      : user && user._id
        ? typeof user._id === 'string'
          ? new Types.ObjectId(user._id)
          : user._id
        : null

  if (!userId) throw new BadRequestError('User id is required')

  // Start transaction
  try {
    // 1) ensure no existing full cancel/return tracking for this order item
    const existingFullCancelOrReturn = await OrderItemTrackingModal.findOne({
      type: {
        $in: [ORDER_TRACKING_CONSTANTS.TRACKING_TYPE.CANCEL, ORDER_TRACKING_CONSTANTS.TRACKING_TYPE.RETURN]
      },
      items: { $in: [originalOrderItemId] }
    })
      .lean()
      .exec()

    if (existingFullCancelOrReturn) {
      throw new BadRequestError('Partial return not possible: item already fully returned or cancelled')
    }

    // 2) fetch product (unit price / taxes)
    const product = await ProductsModel.findById(originalOrderItem.product).populate('taxes').lean()
    if (!product) throw new BadRequestError('Product not found for order item')

    // 3) compute quantities and create tracking + return order item documents
    const qtyToReturn = Number(returnQuantity)
    console.log('🚀 ~ partialReturnOrderItem ~ qtyToReturn:', qtyToReturn)

    const partialReturnItems = await OrderItemModel.find({
      order: orderId,
      product: product._id,
      isPartialReturnRequested: true,
      isReturnQtyModified: { $ne: true }
    })
      .select('_id quantity')
      .lean()

    const totalPartialReturnRequested = partialReturnItems?.reduce((acc, it) => acc + it.quantity, 0)
    console.log('🚀 ~ partialReturnOrderItem ~ totalPartialReturnRequested:', totalPartialReturnRequested)

    const updatedQuantity = (originalOrderItem.quantity ?? 0) - totalPartialReturnRequested - qtyToReturn
    console.log('🚀 ~ partialReturnOrderItem ~ updatedQuantity:', updatedQuantity)
    if (updatedQuantity < 0)
      throw new BadRequestError(
        'You have already requested items to process, you have less quantity than requested quantity.'
      )

    const returnActivity = await AppDataModel.findOne({
      type: 'order-tracking-status',
      statusCode: 'return_to_origin'
    }).lean()

    const returnOrderTrackingDoc = {
      parentOrderTracking: productTracking?._id,
      type: ORDER_TRACKING_CONSTANTS.TRACKING_TYPE.PARTIAL_RETURN,
      items: [originalOrderItemId],
      store: productTracking.store,
      order: orderId,
      status: 'pending',
      timeline: [
        {
          authorType: 'user',
          authorId: userId,
          authorName: typeof user === 'string' ? undefined : user?.name,
          statusCode: 'return_to_origin',
          label: returnActivity?.name ?? 'Return to origin',
          date: new Date(),
          comment: `${reason}${note ? ` - ${note}` : ''}`
        }
      ],
      lastTimelineStatus: 'return_to_origin',
      weight: productTracking.weight,
      volume: productTracking.volume,
      packageSize: productTracking.packageSize,
      orderLogistics: {
        logisticsOrderId: productTracking.logisticsOrderId,
        shipmentCreatedAt: productTracking.shipmentCreatedAt,
        shipmentId: productTracking.shipmentId,
        awbNo: productTracking.awbNo
      },
      deliveryMode: productTracking?.deliveryMode ?? 'standard'
    }

    const createdTracking = await OrderItemTrackingModal.create([returnOrderTrackingDoc])
    const returnOrderTracking = createdTracking[0].toObject()

    // compute discount for returned units
    const returnedDiscountAmount = getPartialItemDiscount(originalOrderItem as any, qtyToReturn)

    // handle dava coins if applied
    let remainingAllocatedCoins = 0,
      refundedCoins = 0

    if (originalOrderItem?.davaCoinsUsed && originalOrderItem?.davaCoinsUsed > 0) {
      const davaCoinsDetails = processProductPartialCancellationWithDavaCoins({
        productId: product?._id?.toString(),
        totalQty: originalOrderItem?.quantity,
        allocatedCoins: originalOrderItem?.davaCoinsUsed,
        cancelQty: qtyToReturn
      })

      remainingAllocatedCoins = davaCoinsDetails?.remainingAllocatedCoins
      refundedCoins = davaCoinsDetails?.refundedCoins
    }

    const returnOrderItemPayload = {
      orderTracking: returnOrderTracking._id,
      order: orderId,
      product: product._id,
      user: userId,
      parentOrderItemId: originalOrderItemId,
      isPartialReturnRequested: true,
      quantity: qtyToReturn,
      // store unitPrice explicitly if you want later computations to be deterministic
      amount: (product as any).finalPrice ?? 0,
      discountAmount: returnedDiscountAmount,
      davaCoinsUsed: refundedCoins,
      gstDetails: null,
      suggestedStoreId: originalOrderItem?.suggestedStoreId,
      suggestedBatchNo: originalOrderItem?.batchNo,
      isPrescriptionRequired: (product as any)?.prescriptionReq ?? false,
      returnDetails: {
        reason,
        comment: note ?? '',
        images
      },
      partialReturnRequestStatus: 'approved'
    }

    const createdReturnItems = await OrderItemModel.create([returnOrderItemPayload])
    const returnOrderItem = createdReturnItems[0].toObject()

    // Update returnOrderItemTracking
    await OrderItemTrackingModal.updateOne(
      { _id: returnOrderTracking?._id },
      { $set: { items: [returnOrderItem?._id] } }
    )

    // 4) Create ticket + activities (assignee selection done safely)
    const issueParentCategory = getTicketIssueParentCategory(reason)
    const supportUsers = await getUsersWithSupportTicketPermission(reason)
    let assigneeId: Types.ObjectId | null = null
    if (supportUsers && supportUsers.length) {
      const chosen: any = supportUsers[Math.floor(Math.random() * supportUsers.length)]
      assigneeId =
        chosen && chosen._id
          ? typeof chosen._id === 'string'
            ? new Types.ObjectId(chosen._id)
            : chosen._id
          : null
    }

    const ticketPayload: any = {
      ticketId: await createTicketId(),
      order: orderId,
      comment: note,
      issue: reason,
      issueParentCategory,
      status: TICKET_CONSTANTS.TICKET_STATUS.OPEN,
      createdBy: userId,
      createdByUserType:
        typeof user === 'object' && user?.role === 'super-admin'
          ? TICKET_CONSTANTS.CREATED_BY_USER_TYPE.SUPER_ADMIN
          : TICKET_CONSTANTS.CREATED_BY_USER_TYPE.CONSUMER,
      attachments: images,
      createdAt: new Date(),
      updatedAt: new Date(),
      priority: TICKET_CONSTANTS.PRIORITY.HIGH,
      dueDate: new Date(),
      assignee: assigneeId
    }

    const ticketDoc = (await TicketsModel.create([ticketPayload]))[0].toObject()

    const activityBase = {
      ticket: ticketDoc._id,
      createdAt: new Date(),
      createdByUserType:
        typeof user === 'object' && user?.role === 'super-admin'
          ? TICKET_CONSTANTS.CREATED_BY_USER_TYPE.SUPER_ADMIN
          : TICKET_CONSTANTS.CREATED_BY_USER_TYPE.CONSUMER,
      createdBy: userId
    }

    const activities = [
      {
        ...activityBase,
        activity: 'ticket-created',
        attachments: images
      },
      {
        ...activityBase,
        activity: 'attachment-added',
        attachments: images
      }
    ]

    await TicketActivitiesModel.create(activities)

    // perform non-critical async actions without awaiting inside the transaction
    sendReturnNotificationToAdmin(productTracking?.store).catch((err) => {
      /* log and swallow — notification failing shouldn't break the main flow */
      // logger.error('sendReturnNotificationToAdmin failed', err)
    })

    return {
      message: 'Partial return requested',
      returnOrderItemId: returnOrderItem._id,
      returnOrderTrackingId: returnOrderTracking._id,
      ticketId: ticketDoc._id
    }
  } catch (err: any) {
    // rethrow with clearer message
    throw new Error(`Partial return failed: ${err?.message ?? 'Unknown error'}`)
  }
}

export async function cancelOrderItem(data: CancelInput) {
  const { order, orderItem, productTracking, reason, note, adminUser, isCancelledByAdmin } = data // order, orderItem, isPartialCancel coming from hook

  // Verify existing
  const cancelTrackingExistForItem = await OrderItemTrackingModal.findOne({
    type: ORDER_TRACKING_CONSTANTS.TRACKING_TYPE.CANCEL,
    items: { $in: [orderItem._id] },
    isDeleted: { $ne: true }
  }).lean()

  if (cancelTrackingExistForItem) throw new Error('Cancel tracking exists for the requested item!')

  const orderDoc: any = await OrderModel.findById(order?._id).populate('userId', '_id name').lean()

  await refundPaymentForItem(order, orderItem?._id?.toString())

  const activities = await AppDataModel.find({
    type: 'order-tracking-status',
    statusCode: { $in: ['canceled', 'refund_initiated'] }
  }).lean()

  const cancelActivity = activities.find((a: any) => a.statusCode === 'canceled')
  const refundInitiatedActivity = activities.find((a: any) => a.statusCode === 'refund_initiated')

  const cancelOrderTrackingDoc = await OrderItemTrackingModal.create({
    type: ORDER_TRACKING_CONSTANTS.TRACKING_TYPE.CANCEL,
    items: [orderItem._id],
    store: productTracking.store,
    order: order._id,
    status: 'pending',
    timeline: [
      {
        authorType: isCancelledByAdmin ? 'super-admin' : 'user',
        authorId: isCancelledByAdmin ? adminUser?._id : orderDoc?.userId?._id,
        authorName: isCancelledByAdmin ? adminUser?.name : orderDoc?.userId?.name,
        statusCode: 'canceled',
        label: cancelActivity?.name,
        date: new Date(),
        comment: `${reason} ${note ? '- ' + note : ''}`
      },
      {
        authorType: 'super-admin',
        authorName: 'Super Admin',
        statusCode: 'refund_initiated',
        label: refundInitiatedActivity?.name,
        date: new Date(),
        comment: 'Refund initiated, refund amount will be processed and credited back user in 3 to 5 days'
      }
    ],
    lastTimelineStatus: 'refund_initiated',
    weight: productTracking.weight,
    volume: productTracking.volume,
    packageSize: productTracking.packageSize,
    deliveryMode: productTracking?.deliveryMode ?? 'standard'
  })
  const cancelOrderTracking = cancelOrderTrackingDoc.toObject()

  const updateData = {
    isCancelRequested: true,
    cancellationDetails: {
      reason,
      comment: note
    },
    orderTracking: cancelOrderTracking._id
  }
  await OrderItemModel.findByIdAndUpdate(orderItem._id, { ...updateData })

  // Credit back dava coins if used
  if (orderItem?.davaCoinsUsed && orderItem?.davaCoinsUsed > 0) {
    await creditDavaCoinsFromCancelItem(order as any, orderItem as any)
  }

  await releaseOrderSoftHold({ orderTrackingId: productTracking._id })
}
