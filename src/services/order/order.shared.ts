// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import {
  CancelOrderService,
  Order,
  OrderConsultationService,
  OrderData,
  OrderPatch,
  OrderQuery,
  OrderService,
  ReturnOrderService
} from './order.class'
import { HookContext } from '../../declarations'
import { ProductsModel } from '../super-admin/products/products.schema'
import { CouponsModel } from '../coupons/coupons.schema'
import { DeliveryPoliciesModel } from '../delivery-policies/delivery-policies.schema'
import { StoreInventoryModel } from '../store-inventory/store-inventory.schema'
import { BadRequest } from '@feathersjs/errors'
import { releaseOrderSoftHold } from '../../utils/inventory'
import { CheckoutSessionModel, OrderModel } from './order.schema'
import { addToOrderCheckoutSessionQueue } from '../../jobs/queues/queue'
import { PaymentModel } from '../payment/payment.schema'
import { OrderItemModel } from '../order-items/order-items.schema'
import mongoose, { Types } from 'mongoose'
import * as OrderIdGenerator from '../../utils/orderIdGenerator'
import {
  CONSTANTS as ORDER_TRACKING_CONSTANTS,
  OrderItemTrackingModal
} from '../order-item-tracking/order-item-tracking.schema'
import { CONSTANTS as ORDER_ITEM_TRACKING } from '../order-item-tracking/order-item-tracking.schema'
import { hasSupportTicketAccess } from '../../cache/redis/permissions'
import { SettingsModel } from '../settings/settings.schema'
import moment from 'moment-timezone'
import { AppDataModel } from '../app-data/app-data.schema'
import { MEMBERSHIP_STATUS, MembershipModel } from '../memberships/memberships.schema'
import { PAYMENT_GATEWAY_MAPPER } from '../../payments'
import { refundPaymentForStore } from '../../payments/refund'
import { app } from '../../app'
import { getProductTaxDetails } from '../../utils/taxCalculation'
import { StoreAdminUserModal } from '../store-admin-users/store-admin-users.schema'
import { notificationServices } from '../../socket/namespaceManager'
import { applyDavaCoinsProductLevel, getRedeemableDavaCoins } from '../../utils/davaCoins'
import { membershipConfig } from '../memberships/memberships.shared'
import { ORDER_CHECKOUT_SESSION_TIMEOUT } from '../../jobs/constants'

export type { Order, OrderData, OrderPatch, OrderQuery }

// export type OrderClientService = Pick<OrderService<Params<OrderQuery>>, (typeof orderMethods)[number]>

export const orderPath = 'order'

export const orderConsultationPath = 'order/:orderid/payment'
export const returnOrderPath = 'order/:orderId/return'
export const cancelOrderPath = 'order/:orderId/cancel'
export const consumerOrderProductsPath = 'order/products'
export const trackOrderPath = 'order/:orderId/track'

export const orderMethods: Array<keyof OrderService> = ['find', 'get', 'create', 'patch', 'remove']

export const orderConsultationMethods: Array<keyof OrderConsultationService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]
export const returnOrderMethod: Array<keyof ReturnOrderService> = ['create']
export const cancelOrderMethod: Array<keyof CancelOrderService> = ['create']

// export const orderClient = (client: ClientApplication) => {
//   const connection = client.get('connection')

//   client.use(orderPath, connection.service(orderPath), {
//     methods: orderMethods
//   })
// }

// // Add this service to the client service type index
// declare module '../../client' {
//   interface ServiceTypes {
//     [orderPath]: OrderClientService
//   }
// }

export const setTimestamp = async (context: HookContext) => {
  const { data, method } = context

  if (method === 'create') {
    data.createdAt = new Date().toISOString()
  }
  data.updatedAt = new Date().toISOString()
  return context
}

export const getPaymentInformation = async ({
  user,
  items,
  zipCode,
  isCouponApplied,
  couponCode,
  deliveryMode,
  cart
}: any): Promise<any> => {
  try {
    let orderTotal = 0,
      subTotal = 0,
      discountAmount = 0,
      deliveryCharge = 0,
      orderItemsDetails = [],
      totalTaxAmount = 0,
      coupon = null,
      isDavaCoinsApplied = false,
      davaCoinsUsed = 0,
      davaOneMembershipAmount = 0

    if (couponCode && isCouponApplied)
      coupon = await CouponsModel.findOne({
        couponCode: { $regex: new RegExp(`^${couponCode}$`, 'i') },
        archive: false
      }).lean()

    for (const item of items) {
      const product = await ProductsModel.findById(item?.productId).populate('taxes').lean()

      if (!product) throw new BadRequest('Product not found')

      if (item.quantity < 1) {
        item.quantity = 1
      }
      // Check maxOrderQuantity allowed
      if (product?.maxOrderQuantity && product.maxOrderQuantity < item.quantity)
        item.quantity = product.maxOrderQuantity

      let productPrice = product?.finalPrice * item?.quantity

      subTotal = subTotal + productPrice

      const taxDetails = getProductTaxDetails({
        ...product,
        quantity: item?.quantity,
        discountedAmount: item?.discountedAmount ?? 0
      })

      orderItemsDetails.push({
        ...item,
        productId: item?.productId,
        quantity: item?.quantity,
        amount: product?.finalPrice,
        total: product?.finalPrice! * item?.quantity,
        gstDetails: taxDetails?.totalRate > 0 ? taxDetails : null
      })

      totalTaxAmount = totalTaxAmount + (taxDetails?.totalAmount ?? 0)
    }

    // Delivery policy heck
    const deliveryPolicy: any = await DeliveryPoliciesModel.findOne({ postalCodes: zipCode }).lean()

    const dMode = deliveryPolicy?.deliveryModes[deliveryMode]

    const { applicableDeliveryCharge, freeMinOrderValue } = getApplicableRange(
      subTotal,
      dMode?.priceRange ?? []
    )

    deliveryCharge = applicableDeliveryCharge || 0

    if (subTotal > freeMinOrderValue!) deliveryCharge = 0

    // check membership benefit check
    const { appliedDeliveryCharge, hasMembershipFreeDeliveryBenefit } = await checkMembershipBenefit(
      user,
      deliveryCharge,
      subTotal
    )

    deliveryCharge = appliedDeliveryCharge

    // check dava coins usage
    if (cart?.isDavaCoinsApplied) {
      const coins = getRedeemableDavaCoins(subTotal, user?.davaCoinsBalance ?? 0)

      if (coins > 0) {
        isDavaCoinsApplied = true
        davaCoinsUsed = coins

        applyDavaCoinsProductLevel(orderItemsDetails, coins)
      }
    }

    let couponData: any = {}
    // Coupon applied check
    if (isCouponApplied) {
      if (coupon) {
        couponData = await applyCouponDiscount(couponCode, subTotal, zipCode, items, user)
        if (couponData) discountAmount = couponData?.discountValue
      }
      if (discountAmount > 0) {
        await calculateProductLevelDiscount(orderItemsDetails, subTotal, discountAmount, couponData)
      }
    }

    // DavaONE Membership applied check
    if (cart?.isDavaOneMembershipAdded) {
      davaOneMembershipAmount = membershipConfig.membershipAmount
    }

    // Other charges
    let handlingCharge = 0
    let packingCharge = 0
    let platformFee = 0
    const generalSettings = await SettingsModel.find({
      settingCategory: 'general',
      settingType: { $in: ['handlingCharge', 'packingCharge', 'platformFee'] }
    }).lean()

    for (const setting of generalSettings) {
      const { settingType, value } = setting
      if (settingType === 'handlingCharge' && value.applicable) {
        handlingCharge = value[settingType] || 0
      }
      if (settingType === 'packingCharge' && value.applicable) {
        packingCharge = value[settingType] || 0
      }
      if (settingType === 'platformFee' && value.applicable) {
        platformFee = value[settingType] || 0
      }
    }

    orderTotal =
      subTotal +
      deliveryCharge +
      handlingCharge +
      packingCharge +
      platformFee +
      davaOneMembershipAmount -
      discountAmount -
      davaCoinsUsed

    return {
      orderTotal,
      subTotal,
      paymentAmount: orderTotal,
      discountedAmount: discountAmount,
      orderItemsDetails,
      deliveryCharge,
      taxAmount: totalTaxAmount,
      handlingCharge,
      packingCharge,
      platformFee,
      hasMembershipFreeDeliveryBenefit,
      isDavaCoinsApplied,
      davaCoinsUsed
    }
  } catch (error) {
    throw error
  }
}

const applyCouponDiscount = async (
  couponCode: string | null,
  totalCartPrice: any,
  zipCode: any,
  items: any,
  user: any
): Promise<number> => {
  if (!couponCode) return 0
  try {
    // Use create method (POST) to avoid issues with large item arrays
    const updatedDiscount = await app
      .service('apply-coupon')
      .create({ couponCode, channel: 'webApp', totalAmount: totalCartPrice, zipCode, items }, { user })
    return updatedDiscount || {}
  } catch {
    return 0
  }
}

export const calculateProductLevelDiscount = async (
  products: any[],
  totalOrderValue: number,
  totalDiscount: number,
  coupon: any
) => {
  const eligibleProductIds =
    Array.isArray(coupon?.products) && coupon.products.length > 0
      ? coupon.products.map((id: any) => id.toString())
      : null

  const eligibleCollectionIds =
    Array.isArray(coupon?.collections) && coupon.collections.length > 0
      ? coupon.collections.map((id: any) => id.toString())
      : null

  const productIds = products.map((p) => p.productId)
  const dbProducts = await ProductsModel.find({ _id: { $in: productIds } })
    .select('_id collections')
    .lean()

  // Build productId → collection map
  const productCollectionMap = new Map<string, string[]>()

  dbProducts.forEach((p) => {
    const collections = Array.isArray(p.collections)
      ? p.collections.map((c: any) => (typeof c === 'object' && c._id ? c._id.toString() : c.toString()))
      : []
    productCollectionMap.set(p._id.toString(), collections)
  })

  // Step 1: Get eligible products
  const eligibleProducts = products.filter((product) => {
    const pid = product.productId.toString()
    const productCollections = productCollectionMap.get(pid) || []

    const isProductEligible = eligibleProductIds?.includes(pid)
    const isCollectionEligible = eligibleCollectionIds
      ? productCollections.some((c) => eligibleCollectionIds.includes(c))
      : false

    return !eligibleProductIds && !eligibleCollectionIds ? true : isProductEligible || isCollectionEligible
  })

  // Step 2: Compute total of eligible products
  const eligibleTotal = eligibleProducts.reduce((sum, p) => {
    const productTotal = (Number(p.amount) || 0) * (Number(p.quantity) || 0)
    return sum + productTotal
  }, 0)

  // Step 3: Apply proportional discount
  products.forEach((product) => {
    const pid = product.productId.toString()
    const productCollections = productCollectionMap.get(pid) || []

    const isProductEligible = eligibleProductIds?.includes(pid)
    const isCollectionEligible = eligibleCollectionIds
      ? productCollections.some((c) => eligibleCollectionIds.includes(c))
      : false

    const isEligible =
      !eligibleProductIds && !eligibleCollectionIds ? true : isProductEligible || isCollectionEligible

    const productTotal = (Number(product.amount) || 0) * (Number(product.quantity) || 0)

    if (!isEligible || eligibleTotal === 0) {
      product.discountAmount = 0
    } else {
      const share = productTotal / eligibleTotal
      const rawDiscount = totalDiscount * share

      product.discountAmount = Math.min(productTotal, parseFloat(rawDiscount.toFixed(2)))
    }
  })
}

export const createCheckoutSession = async ({
  order,
  orderItems,
  data,
  user
}: {
  order: any
  orderItems: any
  data: any
  user: any
}) => {
  const checkoutItems = orderItems.map((item: any) => ({
    productId: item.product,
    storeId: item.suggestedStoreId,
    quantity: item.quantity,
    softHoldRelease: false
  }))

  const checkoutSession = {
    orderId: order._id,
    userId: user._id,
    items: checkoutItems,
    status: 'active',
    sessionStartTime: new Date(),
    sessionEndTime: new Date(new Date().getTime() + ORDER_CHECKOUT_SESSION_TIMEOUT),
    createdAt: new Date()
  }

  await CheckoutSessionModel.create(checkoutSession)

  for (const checkoutItem of checkoutSession.items) {
    await StoreInventoryModel.findOneAndUpdate(
      { storeId: checkoutItem.storeId, productId: checkoutItem.productId },
      { $inc: { softHoldCount: checkoutItem.quantity } }
    )
  }

  addToOrderCheckoutSessionQueue({ orderId: order._id })

  const paymentMode: 'razorpay' | 'payu' = data.paymentMode
  const paymentGateway = new PAYMENT_GATEWAY_MAPPER[paymentMode]()

  const paymentInfo = await paymentGateway.initOrder({
    currency: 'INR',
    paymentAmount: order.paymentAmount,
    userId: user._id.toString(),
    userSocketId: data?.userSocketId,
    paymentType: 'online',
    orderId: order._id.toString(),
    couponCode: order?.couponCode,
    productInfo: 'Davaindia Medicines',
    email: user?.email,
    customerName: user?.name,
    phone: user?.phoneNumber,
    deviceType: order?.deviceType
  })

  await OrderModel.findByIdAndUpdate(order._id, { paymentOrderId: paymentInfo.id })
  await PaymentModel.create({
    amount: order.paymentAmount,
    currency: order.currency,
    order: order._id,
    paymentGateway: order.paymentMode,
    status: 'pending',
    paymentFor: 'order',
    paymentOrderId: paymentInfo.id
  })

  return paymentInfo
}

export function isOlderThan7Days(dateString: string) {
  // return moment().diff(moment(dateString, 'YYYY-MM-DD'), 'days') > 7

  // Convert given date to IST
  const givenDateIST = moment.utc(dateString).tz('Asia/Kolkata')

  // Get current date in IST
  const nowIST = moment().tz('Asia/Kolkata')

  // Get the date 7 days ago from now
  const sevenDaysAgoIST = nowIST.clone().subtract(7, 'days')

  // Compare
  return givenDateIST.isBefore(sevenDaysAgoIST)
}

export const validateUserOrderAccess = async (context: HookContext) => {
  const { data, method, params } = context
  const orderId = params?.route?.orderId
  const { productId: orderItemId, returnQuantity } = data
  if (!orderId) throw new Error('Order id not provided')

  if (!orderItemId) throw new Error('Product id not provided')

  const order = await OrderModel.findById(orderId).lean()
  if (!order) throw new Error('Order not found')

  const userType = params?.user?.role || 'consumer'
  if (userType === 'consumer') {
    if (order.userId.toString() !== params.user._id.toString()) throw new Error('Order not found')
  } else if (userType === 'super-admin') {
    // TODO check if super admin has full access or order access rights
  } else throw new Error('You are not authorized to access this end point')

  const orderItem = await OrderItemModel.findById(orderItemId).lean()
  if (!orderItem) throw new Error('Item not found in order')

  if (orderItem.isReturnRequested) throw new Error('Return request was already placed')
  if (orderItem.isCancelRequested) throw new Error('Cancelled item can not be returned')
  const productId = orderItem.product

  const orderTracking = await OrderItemTrackingModal.find({
    order: order._id,
    isDeleted: { $ne: true }
  })
    .populate({ path: 'items', populate: { path: 'product' } })
    .lean()

  if (!orderTracking.length) throw new Error('Order tracking not found')
  let deliveredActivityFound = false,
    deliveredActivity,
    productTracking

  for (const tracking of orderTracking) {
    if (tracking.type === ORDER_ITEM_TRACKING.TRACKING_TYPE.ORDER) {
      for (const item of tracking.items as any) {
        if (item.product._id.toString() === productId.toString()) {
          productTracking = tracking
          const timeline = tracking.timeline
          deliveredActivity = timeline.find((t: any) => t.statusCode === 'delivered')
          if (deliveredActivity) {
            deliveredActivityFound = true
            break
          }
        }
        if (deliveredActivityFound) break
      }
    }
  }
  if (!deliveredActivityFound) throw new Error('Item not delivered yet so can not be returned')

  if (isOlderThan7Days(deliveredActivity?.date))
    throw new Error('Return window closed after 7 days of order delivered')

  context.data.user = params?.user
  context.data.order = order
  context.data.orderItem = orderItem
  context.data.productTracking = productTracking
  context.data.returnQuantity = returnQuantity ? Number(returnQuantity) : 0
  context.data.isPartialReturn = returnQuantity
    ? Number(returnQuantity) !== Number(orderItem.quantity)
    : false

  return context
}

export const validateOrderUserForCancellation = async (context: HookContext) => {
  const { data, method, params } = context
  const orderId = params?.route?.orderId

  const { productId: orderItemId, cancelQuantity } = data

  if (!orderId) throw new Error('Order id not provided')

  if (!orderItemId) throw new Error('Product id not provided')

  const order = await OrderModel.findById(orderId).lean()

  if (!order) throw new Error('Order not found')

  const userType = params?.user?.role || 'consumer'

  if (userType === 'consumer') {
    if (order.userId.toString() !== params.user._id.toString()) throw new Error('Order not found')
  } else if (userType === 'super-admin') {
    // TODO check if super admin has full access or order access rights
    const { user } = params
    const hasAccess = user?.fullAccess || (await hasSupportTicketAccess(user._id, data.reason))
    if (!hasAccess) throw new Error('You are not authorized to access this end point')
  } else throw new Error('You are not authorized to access this end point')

  const orderItem = await OrderItemModel.findById(orderItemId).lean()
  if (!orderItem) throw new Error('Item not found in order')

  if (orderItem.isReturnRequested) throw new Error('This item can not be cancelled')
  if (orderItem.isCancelRequested)
    throw new Error('You have already placed cancellation request for this item')

  const orderTracking = await OrderItemTrackingModal.find({
    order: order._id,
    isDeleted: { $ne: true }
  })
    .populate({ path: 'items', populate: { path: 'product' } })
    .lean()

  if (!orderTracking.length) throw new Error('Order tracking not found')

  let dispatchedActivityFound = false
  let productTracking

  for (const tracking of orderTracking) {
    if (tracking.type === ORDER_ITEM_TRACKING.TRACKING_TYPE.ORDER) {
      for (const item of tracking.items as any) {
        if (item.product._id.toString() === orderItem.product.toString()) {
          productTracking = tracking
          const timeline = tracking.timeline
          const deliveredActivity = timeline.find((t: any) => t.statusCode === 'dispatched')
          if (deliveredActivity) {
            dispatchedActivityFound = true
            break
          }
        }
        if (dispatchedActivityFound) break
      }
    }
  }
  if (dispatchedActivityFound) throw new Error('Item has been dispatched and can not be cancelled now')

  context.data.user = params?.user
  context.data.order = order
  context.data.orderItem = orderItem
  context.data.productTracking = productTracking
  context.data.cancelQuantity = cancelQuantity ? Number(cancelQuantity) : 0
  context.data.isPartialCancel = cancelQuantity
    ? Number(cancelQuantity) !== Number(orderItem.quantity)
    : false

  return context
}

export const cancelStoreOrder = async (orderItemTracking: any) => {
  const orderId: string | mongoose.Types.ObjectId = orderItemTracking.order._id
  const storeId: string | mongoose.Types.ObjectId = orderItemTracking.store

  // check if order allocated to multiple stores
  const order = await OrderModel.findById(orderId).lean()
  if (!order) throw new Error('Order not found')

  const cancelableItems = orderItemTracking?.items?.filter((i: any) => !i.isCancelRequested)

  const processRefundAmount = async () => {
    // calculate total refundable amount
    const refundableAmount = cancelableItems?.reduce(
      (acc: number, it: any) => acc + (it.quantity * it.amount - it.discountAmount),
      0
    )
    console.log('🚀 ~ processRefundAmount ~ refundAmount:', refundableAmount)

    const trackings = await OrderItemTrackingModal.find({
      order: orderId,
      type: ORDER_TRACKING_CONSTANTS.TRACKING_TYPE.ORDER,
      isDeleted: { $ne: true }
    })
      .populate('items', '_id isCancelRequested')
      .lean()

    let isFullRefund = false
    if (trackings?.length === 1) isFullRefund = true
    else {
      // check other tracking which has active items
      const allTrackingCanceled = trackings
        .filter((t) => t._id.toString() !== orderItemTracking?._id?.toString())
        .every((t) => t.items.every((i: any) => i?.isCancelRequested))
      if (allTrackingCanceled) isFullRefund = true
    }
    console.log('🚀 ~ processRefundAmount ~ isFullRefund:', isFullRefund)

    let chargesApplied = 0
    if (isFullRefund) {
      chargesApplied =
        (order?.deliveryCharge ?? 0) +
        (order?.handlingCharge ?? 0) +
        (order?.platformFee ?? 0) +
        (order?.packingCharge ?? 0)
    }
    console.log('🚀 ~ processRefundAmount ~ chargesApplied:', chargesApplied)

    const finalRefundAmount = refundableAmount + chargesApplied
    console.log('🚀 ~ processRefundAmount ~ finalRefundAmount:', finalRefundAmount)

    // Manage discounts applied on order. if any
    if (finalRefundAmount > 0) {
      if (!order?.skipRefund)
        await refundPaymentForStore({
          order,
          orderItemTrackingId: orderItemTracking._id.toString(),
          canceledItems: cancelableItems.map((i: any) => i._id.toString()),
          refundAmount: finalRefundAmount
        })
    }
  }

  await processRefundAmount()

  const activities = await AppDataModel.find({
    type: 'order-tracking-status',
    statusCode: { $in: ['canceled', 'refund_initiated'] }
  }).lean()
  const cancelActivity = activities.find((a: any) => a.statusCode === 'canceled')
  const refundInitiatedActivity = activities.find((a: any) => a.statusCode === 'refund_initiated')

  const cancelOrderTrackingDoc = await OrderItemTrackingModal.create({
    type: ORDER_TRACKING_CONSTANTS.TRACKING_TYPE.CANCEL,
    items: cancelableItems.map((i: any) => i._id),
    store: new Types.ObjectId(storeId),
    order: order._id,
    status: 'pending',
    timeline: [
      {
        statusCode: 'canceled',
        label: cancelActivity?.name,
        date: new Date()
      },
      {
        statusCode: 'refund_initiated',
        label: refundInitiatedActivity?.name,
        date: new Date()
      }
    ],
    lastTimelineStatus: 'refund_initiated',
    weight: orderItemTracking.weight,
    volume: orderItemTracking.volume,
    packageSize: orderItemTracking.packageSize
  })
  const cancelOrderTracking = cancelOrderTrackingDoc.toObject()
  const updateData = {
    isCancelRequested: true,
    cancellationDetails: {
      reason: '',
      comment: 'Canceled by Super Admin'
    },
    orderTracking: cancelOrderTracking._id
  }
  await OrderItemModel.updateMany({ _id: { $in: cancelableItems.map((i: any) => i._id) } }, { ...updateData })

  // TODO remove only canceled products from order hold
  await releaseOrderSoftHold({ orderTrackingId: orderItemTracking._id })
  return {}
}

const getApplicableRange = (totalPrice: number, priceRanges: any[]) => {
  let applicableRange, freeDeliveryRange
  for (const range of priceRanges) {
    if (totalPrice >= range.priceFrom && totalPrice < range.priceTo) applicableRange = range
    if (range.noLimit) freeDeliveryRange = range
  }
  return {
    applicableRange,
    applicableDeliveryCharge: applicableRange?.deliveryCharge ?? 0,
    freeMinOrderValue: freeDeliveryRange?.priceFrom ?? 0
  }
}

export const generateRunningOrderId = async () => {
  // Use Redis atomic counter to prevent race condition
  return await OrderIdGenerator.generateRunningOrderId()
}

export const generatePendingOrderId = async () => {
  // Use Redis atomic counter to prevent race condition
  return await OrderIdGenerator.generatePendingOrderId()
}

const checkMembershipBenefit = async (user: any, appliedDeliveryCharge: number, totalCartPrice: number) => {
  if (!user?.hasDavaoneMembership || appliedDeliveryCharge === 0)
    return { appliedDeliveryCharge, hasMembershipFreeDeliveryBenefit: false }

  const membership = await MembershipModel.findOne({
    _id: user?.davaoneMembership,
    status: MEMBERSHIP_STATUS.ACTIVE
  })
    .select('_id freeDeliveryBalance')
    .lean()

  if (
    membership?.freeDeliveryBalance &&
    membership?.freeDeliveryBalance > 0 &&
    totalCartPrice > membershipConfig.FREE_DELIVERY_PRICE
  ) {
    return { appliedDeliveryCharge: 0, hasMembershipFreeDeliveryBenefit: true }
  } else return { appliedDeliveryCharge, hasMembershipFreeDeliveryBenefit: false }
}

export const sendReturnNotificationToAdmin = async (storeId: string) => {
  try {
    if (!storeId) return

    const users = await StoreAdminUserModal.find({ storeIds: { $in: [storeId] } }).lean()

    for (const user of users) {
      const userId = user._id?.toString()
      notificationServices.adminNotifications.sendNotificationToUser(userId, {
        recipientId: userId,
        recipientType: 'admin',
        title: 'Order Return',
        message: 'An return request has been placed by user',
        type: 'order-return',
        data: {},
        isRead: false,
        createdAt: moment().toDate(),
        priority: 'normal'
      })
    }
  } catch (e) {
    throw e
  }
}
