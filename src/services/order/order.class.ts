// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import type { MongoDBAdapterOptions, MongoDBAdapterParams } from '@feathersjs/mongodb'

import { BadRequest } from '@feathersjs/errors'
import moment from 'moment'
import { ObjectId } from 'mongodb'
import { Types } from 'mongoose'
import { app } from '../../app'
import { getUsersWithSupportTicketPermission } from '../../cache/redis/permissions'
import { getStore } from '../../cachedResources/order/cache/orderCache'
import { getTicketIssueParentCategory } from '../../constants/general'
import type { Application } from '../../declarations'
import { PAYMENT_GATEWAY_MAPPER } from '../../payments'
import LogisticsAggregator from '../../utils/logistics/Logistics'
import { findNearestStores, getStoresDistances } from '../../utils/nearestStore'
import { getProductTaxDetails } from '../../utils/taxCalculation'
import { CONSTANTS as APP_DATA_CONSTANTS, AppDataModel } from '../app-data/app-data.schema'
import { cartModel } from '../carts/carts.schema'
import { ConsultationModal } from '../consultations/consultations.schema'
import { DeliveryPoliciesModel } from '../delivery-policies/delivery-policies.schema'
import {
  CONSTANTS as ORDER_TRACKING_CONSTANTS,
  OrderItemTrackingModal
} from '../order-item-tracking/order-item-tracking.schema'
import { OrderItemModel } from '../order-items/order-items.schema'
import { StoreInventoryModel } from '../store-inventory/store-inventory.schema'
import { StoreModel } from '../stores/stores.schema'
import { ProductsModel } from '../super-admin/products/products.schema'
import { TicketActivitiesModel } from '../support/support.schema'
import { createTicketId } from '../tickets/tickets.class'
import { CONSTANTS as TICKET_CONSTANTS, TicketsModel } from '../tickets/tickets.schema'
import { ZipCodesModel } from '../zip-codes/zip-codes.schema'
import { OrderModel, type Order, type OrderData, type OrderPatch, type OrderQuery } from './order.schema'
import {
  createCheckoutSession,
  generatePendingOrderId,
  getPaymentInformation,
  isOlderThan7Days,
  sendReturnNotificationToAdmin
} from './order.shared'
// import { onPaymentCaptured } from '../../payments/utils'
import { getProductStockStatus } from '../super-admin/products/products.shared'
import { UsersModel } from '../users/users.schema'
import { cancelOrderItem, partialCancelOrderItem, partialReturnOrderItem } from './utils'

export type { Order, OrderData, OrderPatch, OrderQuery }

export interface OrderParams extends MongoDBAdapterParams<OrderQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class OrderService {
  constructor() {}

  async find(params: Params) {
    try {
      const user = params.user
      if (!user?._id) return []

      // pagination
      const query = params.query || {}
      const page = Math.max(1, parseInt(query.page) || 1)
      const limit = Math.max(1, parseInt(query.limit) || 10)
      const skip = (page - 1) * limit
      const isPaginated = !!(query.page || query.limit)
      
      // date filter
      const dateFilter = query.dateFilter
      let dateRange: { $gte?: Date; $lte?: Date } = {}
      
      if (dateFilter) {
        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        
        switch (dateFilter) {
          case '7days':
            dateRange.$gte = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case '15days':
            dateRange.$gte = new Date(startOfToday.getTime() - 15 * 24 * 60 * 60 * 1000)
            break
          case '30days':
            dateRange.$gte = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          case 'thisYear':
            dateRange.$gte = new Date(now.getFullYear(), 0, 1)
            dateRange.$lte = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
            break
          case 'lastYear':
            dateRange.$gte = new Date(now.getFullYear() - 1, 0, 1)
            dateRange.$lte = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999)
            break
        }
      }

      // fetch statuses once
      const consumerVisibleActivities = await AppDataModel.find({
        type: APP_DATA_CONSTANTS.TYPE.TRACKING_STATUS,
        visibility: 'consumer'
      }).lean()
      const statusCodes = consumerVisibleActivities.map((a) => a.statusCode || []).filter(Boolean)

      // collection names (use model collection names where possible)
      const orderItemsColl = OrderItemModel.collection.name // robust to actual collection name
      const productsColl = 'products'
      const trackingColl = 'order-item-tracking'

      // Aggregation: join Order -> OrderItems -> Products -> OrderItemTracking
      // Use $facet so we can get totalOrders and paginated data in one DB round-trip
      const facetPipeline: any = [
        {
          $facet: {
            metadata: [{ $count: 'totalOrders' }],
            data: [
              { $sort: { _id: -1 } },
              { $skip: skip },
              { $limit: limit },

              // lookup order items (for each order)
              {
                $lookup: {
                  from: orderItemsColl,
                  let: { orderId: '$_id' },
                  pipeline: [
                    { $match: { $expr: { $eq: ['$order', '$$orderId'] } } },

                    // bring product details
                    {
                      $lookup: {
                        from: productsColl,
                        localField: 'product',
                        foreignField: '_id',
                        as: 'productDetails'
                      }
                    },
                    { $unwind: '$productDetails' },

                    // bring order-item-tracking document referenced by orderItem.orderTracking
                    {
                      $lookup: {
                        from: trackingColl,
                        let: { orderTrackingId: '$orderTracking' },
                        pipeline: [
                          {
                            $match: {
                              $expr: {
                                $and: [{ $eq: ['$_id', '$$orderTrackingId'] }, { $ne: ['$isDeleted', true] }]
                              }
                            }
                          }
                        ],
                        as: 'orderTrackingDetails'
                      }
                    },
                    { $unwind: '$orderTrackingDetails' },

                    // group by orderTracking to produce a store-level group (same shape as your previous agg)
                    {
                      $group: {
                        _id: '$orderTracking',
                        trackingDetails: { $first: '$orderTrackingDetails' },
                        items: {
                          $push: {
                            _id: '$_id',
                            title: '$productDetails.title',
                            description: '$productDetails.description',
                            thumbnail: '$productDetails.thumbnail',
                            amount: '$amount',
                            quantity: '$quantity',
                            isCancelRequested: '$isCancelRequested',
                            isReturnRequested: '$isReturnRequested',
                            aboutProduct: {
                              finalPrice: '$productDetails.finalPrice',
                              maximumRetailPrice: '$productDetails.maximumRetailPrice',
                              discount: '$productDetails.discount',
                              discountType: '$productDetails.discountType',
                              hasVariation: '$productDetails.hasVariation',
                              brandTags: '$productDetails.brandTags',
                              collections: '$productDetails.collections',
                              composition: '$productDetails.compositions',
                              consumption: '$productDetails.consumption',
                              prescriptionReq: '$productDetails.prescriptionReq',
                              maxOrderQuantity: '$productDetails.maxOrderQuantity',
                              minOrderQuantity: '$productDetails.minOrderQuantity',
                              images: '$productDetails.images',
                              tags: '$productDetails.tags',
                              taxAmount: '$productDetails.taxAmount',
                              seo: '$productDetails.seo',
                              suitableFor: '$productDetails.suitableFor',
                              dosage: '$productDetails.dosage',
                              cautions: '$productDetails.cautions',
                              benefits: '$productDetails.benefits',
                              thumbnail: '$productDetails.thumbnail',
                              info: '$productDetails.info',
                              _id: '$productDetails._id',
                              isActive: '$productDetails.isActive'
                            }
                          }
                        },
                        totalQuantity: { $sum: '$quantity' },
                        totalAmount: { $sum: { $multiply: ['$quantity', '$amount'] } }
                      }
                    },

                    {
                      $project: {
                        _id: 0,
                        orderTracking: '$_id',
                        trackingDetails: 1,
                        items: 1,
                        totalQuantity: 1,
                        totalAmount: 1
                      }
                    }
                  ],
                  as: 'orderItemsByStore'
                }
              },

              // unwind to produce one document per order-per-orderTracking group
              { $unwind: { path: '$orderItemsByStore', preserveNullAndEmptyArrays: true } },

              // filter timeline inside aggregation using the statusCodes we fetched earlier
              {
                $addFields: {
                  'orderItemsByStore.trackingDetails.timeline': {
                    $cond: [
                      { $isArray: '$orderItemsByStore.trackingDetails.timeline' },
                      {
                        $filter: {
                          input: '$orderItemsByStore.trackingDetails.timeline',
                          as: 't',
                          cond: { $in: ['$$t.statusCode', statusCodes] }
                        }
                      },
                      []
                    ]
                  }
                }
              },

              // shape final result combining order-level fields and store-level grouping
              {
                $project: {
                  _id: '$_id',
                  orderId: '$orderId',
                  createdAt: '$createdAt',
                  status: '$status',
                  prescription: '$prescription',
                  orderTracking: '$orderItemsByStore.orderTracking',
                  trackingDetails: '$orderItemsByStore.trackingDetails',
                  items: '$orderItemsByStore.items',
                  totalQuantity: '$orderItemsByStore.totalQuantity',
                  totalAmount: '$orderItemsByStore.totalAmount'
                }
              }
            ]
          }
        }
      ]

      // base match for user and paid orders
      const baseMatch: any = {
        $match: {
          userId: user._id,
          status: { $nin: ['pending', 'failed'] }
        }
      }
      
      // Add date range filter if present
      if (dateRange.$gte || dateRange.$lte) {
        baseMatch.$match.createdAt = dateRange
      }

      const agg = await OrderModel.aggregate([baseMatch, ...facetPipeline])

      const metadata = (agg[0] && agg[0].metadata && agg[0].metadata[0]) || { totalOrders: 0 }
      const rawData = (agg[0] && agg[0].data) || []

      // Apply checkReturnWindowStatus (JS function) to each item once
      const processed = rawData.map((d: any) => {
        // ensure timeline exists
        const timeline = d.trackingDetails?.timeline || []
        // call your existing business logic to set return-window flags, etc.
        const updated = this.checkReturnWindowStatus(d, timeline)
        // keep original order fields
        return {
          _id: d._id,
          orderId: d.orderId,
          createdAt: d.createdAt,
          status: d.status,
          prescription: d.prescription,
          ...updated
        }
      })

      if (isPaginated) {
        const totalOrders = metadata.totalOrders || 0
        const totalPages = Math.ceil(totalOrders / limit)
        // total = number of distinct orders present on this page (keeps compatibility with your previous contract)
        const totalDistinctOrdersOnPage = new Set(processed.map((p: any) => String(p._id))).size

        return {
          data: processed,
          total: totalDistinctOrdersOnPage,
          page,
          limit,
          totalPages
        }
      }

      return processed
    } catch (err) {
      throw err
    }
  }

  async get(id: any): Promise<any> {
    try {
      const order = await OrderModel.findById(id).populate('userId').populate('patientId').lean()

      if (!order) {
        throw new BadRequest('Category not found')
      }

      const trackings = await this.getOrderItemsByStore(order)

      const orderItemsByStore = trackings.map((os) => {
        const timeline = os.trackingDetails.timeline

        return this.checkReturnWindowStatus(os, timeline)
      })

      return { ...order, orderItemsByStore }
    } catch (error) {
      // console.log(error)
      throw error
    }
  }

  checkReturnWindowStatus(os: any, timeline: Array<any>) {
    if (os?.trackingDetails?.type === 'order') {
      const deliveredActivity = timeline.find((t: any) => t.statusCode === 'delivered')
      if (isOlderThan7Days(deliveredActivity?.date)) {
        os.returnWindowClosed = true
        os.returnWindowClosedDate = moment(deliveredActivity?.date).add(7, 'days').format('DD MMM YYYY')
      }
    }

    return os
  }

  /**
   * Create order
   */
  async create(data: OrderData, params: Params<OrderQuery>) {
    // Helper short-hands
    const user = await UsersModel.findById(params?.user?._id).lean()
    if (!user) throw new BadRequest('Not allowed')

    // Helper utils
    const toIdStr = (id: any) => id?.toString?.() ?? ''
    const nowIso = () => new Date().toISOString()

    // Validate & fetch delivery policy
    const postalCodeFromRequest = data?.address?.postalCode
    const deliveryPolicy = await DeliveryPoliciesModel.findOne({
      postalCodes: postalCodeFromRequest,
      active: true
    }).lean()
    if (!deliveryPolicy) throw new BadRequest('Order can not be delivered to this pin code')

    // Flags / initial values
    let items: any[] = []
    let prescriptionRequired = false
    let couponCode: string | null = null
    let postalCode: string = ''
    let address: any = null
    let addressId: any = null
    let coordinates: { longitude?: number; latitude?: number } | null = null

    const consultationId = data?.consultationId
    const orderType = data?.orderType
    const isBuyNow = orderType === 'buy-now'
    const isConsultation = orderType === 'consultation'
    const isItemsWithoutPrescription = orderType === 'items-without-prescription'

    // Load cart
    const cart = await cartModel.findOne({ userId: user._id }).lean()
    if (!cart) throw new BadRequest('Cart is empty')

    // Determine items based on order type
    if (isConsultation && consultationId) {
      const consultation = await ConsultationModal.findById(consultationId).lean()
      if (!consultation) throw new BadRequest('Consultation not found')

      // items in cart that belong to this consultation
      items = (cart.items || []).filter((i: any) => toIdStr(i?.consultationId) === toIdStr(consultationId))

      // ensure every selected item is part of consultation medicines
      const consultationMedicines = new Set(
        (consultation.medicines || []).map((m: any) => toIdStr(m.productId))
      )
      const consultationOnly = items.every((i: any) => consultationMedicines.has(toIdStr(i.productId)))
      if (!consultationOnly) throw new BadRequest('Cart products do not match with consultation medicine')
    }

    if (isBuyNow) {
      items = (cart.items || []).filter((i: any) => !!i.isBuyNowItem)
    }

    if (isItemsWithoutPrescription) {
      items = (cart.items || []).filter((i: any) => !i.prescriptionReq && !!i.isSelected)
    }

    if (!isBuyNow && !isConsultation && !isItemsWithoutPrescription) {
      // default: selected items not linked to consultation
      items = (cart.items || []).filter((i: any) => !!i.isSelected && !i.consultationId)
    }

    if (!items.length) throw new BadRequest('No items added in cart')

    // Fetch product metadata (prescription requirements) in one query
    const productIds = items.map((p: any) => p.productId)
    const cartProducts = await ProductsModel.find({ _id: { $in: productIds } })
      .select('_id prescriptionReq')
      .lean()

    if (!isConsultation) {
      prescriptionRequired = cartProducts.some((p: any) => !!p.prescriptionReq)
      if (prescriptionRequired && !isItemsWithoutPrescription) {
        const hasPrescriptionUrls = !!data?.prescription?.urls?.length
        if (!hasPrescriptionUrls && !data?.consultDoctorForPrescription)
          throw new BadRequest('Prescription is required')
      }
    }

    // Coupon & address info
    const isCouponCodeApplied = !!cart?.couponCode
    couponCode = cart?.couponCode ?? null
    address = data?.address ?? null
    addressId = data?.addressId ?? null
    postalCode = data?.address?.postalCode ?? ''

    // Delivery mode check
    const deliveryMode: any = cart?.deliveryMode ?? 'standard'
    if (!this.isDeliveryModeAvailable(deliveryPolicy, deliveryMode))
      throw new Error('DELIVERY_MODE_NOT_AVAILABLE')

    // Determine coordinates: prefer provided address coordinates (for oneDay), otherwise lookup zip
    if (address && address.coordinates && deliveryMode === 'oneDay') {
      const { longitude, latitude } = address.coordinates
      coordinates = { longitude, latitude }
    } else if (postalCode) {
      const zipDoc = await ZipCodesModel.findOne({ zipCode: postalCode }).lean()
      if (zipDoc && Array.isArray(zipDoc.location?.coordinates)) {
        const [longitude, latitude] = zipDoc.location.coordinates
        coordinates = { longitude, latitude }
      }
    }

    // Ordered items: include all items for consultation orders, otherwise only selected ones
    const orderedItems = items.filter((it: any) => !!it.isSelected || isConsultation)
    if (!orderedItems.length) throw new BadRequest('No items added in cart')

    // Verify stock & deliverability for each ordered item (batching where possible is tricky because helper expects single product)
    for (const item of orderedItems) {
      const qty = Number(item.quantity ?? 1)
      const stockStatus = await getProductStockStatus(deliveryPolicy, item.productId, qty, postalCode)
      if (stockStatus.isOutOfStock) throw new Error('ONE_OR_MORE_ITEMS_OUT_OF_STOCK')
      if (stockStatus.isNotDeliverable) throw new Error('DELIVERY_MODE_NOT_AVAILABLE')
    }

    // Get active & available stores and distances
    const activeStores = await this.getActiveStores(deliveryPolicy, postalCode)
    const availableStores = await this.getAvailableStore(activeStores, orderedItems)
    const storeWithDistance = await getStoresDistances({
      userZipCode: postalCode ?? '',
      userZipLat: coordinates?.latitude ?? 0,
      userZipLon: coordinates?.longitude ?? 0,
      activeStores: availableStores,
      policyId: deliveryPolicy._id.toString()
    })

    // Allocate stores to products (nearest)
    if (storeWithDistance.length > 0) {
      const storeAllocations: any[] = findNearestStores(orderedItems, storeWithDistance)

      // Build productId -> storeId map (first occurrence wins)
      const productToStoreMap = new Map<string, string>()
      for (const storeAlloc of storeAllocations) {
        const storeIdStr = toIdStr(storeAlloc.storeId)
        for (const p of storeAlloc.items || []) {
          const pid = toIdStr(p.productId ?? p) // support both objects and raw ids
          if (pid && !productToStoreMap.has(pid)) productToStoreMap.set(pid, storeIdStr)
        }
      }

      // pre-compute stores within 7km
      const storesWithin7km = storeWithDistance.filter(
        (s: any) => typeof s.distance !== 'undefined' && s.distance <= 7000
      )

      // annotate ordered items with storeId and deliverability notes
      for (const item of orderedItems) {
        const pid = toIdStr(item.productId)
        // same-day deliverability check
        if (deliveryMode === 'oneDay') {
          const inRange = storesWithin7km.some((s: any) =>
            (s.items || []).map((i: any) => toIdStr(i)).includes(pid)
          )
          if (!inRange) {
            item.isNotDeliverable = true
            item.note =
              'Your selected location is outside the delivery range for Same-Day delivery. Please choose a different delivery mode.'
          }
        }

        if (productToStoreMap.has(pid)) {
          item.storeId = new ObjectId(productToStoreMap.get(pid)!)
        } else {
          item.storeId = null
          item.isNotDeliverable = true
          item.note = item.note ?? 'This product is currently out of stock in all nearby stores.'
        }
      }
    }

    // If oneDay, verify courier serviceability for items (may throw)
    if (deliveryMode === 'oneDay') {
      await this.checkCourierServiceability(orderedItems, address)
    }

    // Payment & pricing calculation
    const paymentInput = {
      user,
      items: orderedItems,
      zipCode: postalCode,
      isCouponApplied: isCouponCodeApplied,
      couponCode,
      deliveryMode: deliveryMode,
      cart
    }

    const {
      orderTotal,
      subTotal,
      discountedAmount,
      orderItemsDetails,
      deliveryCharge,
      taxAmount,
      handlingCharge,
      packingCharge,
      platformFee,
      hasMembershipFreeDeliveryBenefit = false,
      isDavaCoinsApplied,
      davaCoinsUsed
    } = await getPaymentInformation(paymentInput)

    // Create order document
    const orderDoc = await OrderModel.create({
      addressId,
      currency: 'INR',
      offerId: null,
      orderTotal,
      subTotal,
      paymentAmount: orderTotal,
      userId: user._id,
      status: 'pending',
      items: orderItemsDetails,
      discountedAmount: discountedAmount ?? 0,
      deliveryCharge: deliveryCharge ?? 0,
      handlingCharge,
      packingCharge,
      platformFee,
      taxAmount: taxAmount ?? 0,
      paymentMode: data?.paymentMode ?? 'razorpay',
      orderId: await generatePendingOrderId(),
      hasPrescription: consultationId ? true : prescriptionRequired,
      consultDoctorForPrescription: data?.consultDoctorForPrescription ?? false,
      prescription: data?.prescription ? data.prescription : undefined,
      address: { ...(address ?? {}), coordinates },
      couponCode,
      deliveryMode,
      patientId: cart?.patientId,
      hasMembershipFreeDeliveryBenefit,
      deviceType: data?.deviceType ?? 'web',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      dateOfConsult: cart?.dateOfConsult,
      timeOfConsult: cart?.timeOfConsult,
      phoneNumber: cart?.phoneNumber,
      isDavaCoinsApplied,
      davaCoinsUsed,
      utmParams: data?.utmParams ?? null,
      davaOneMembershipAmount: cart?.davaOneMembershipAmount ?? 0,
      isDavaOneMembershipAdded: cart?.isDavaOneMembershipAdded ?? false
    })

    const order = orderDoc.toObject()

    // Create order-items (bulk-friendly: fetch products first, then create items)
    const productIdSet = new Set(orderItemsDetails.map((it: any) => toIdStr(it.productId)))
    const productsMapRaw = await ProductsModel.find({ _id: { $in: Array.from(productIdSet) } })
      .populate('taxes')
      .lean()
    const productsMap = new Map<string, any>()
    for (const p of productsMapRaw) productsMap.set(toIdStr(p._id), p)

    const checkoutOrderItems: any[] = []
    for (const item of orderItemsDetails) {
      const product = productsMap.get(toIdStr(item.productId))
      const gstDetails = getProductTaxDetails({
        ...product,
        quantity: item.quantity,
        discountedAmount: item.discountedAmount ?? 0
      })

      const suggestedStoreId = item.storeId ? new ObjectId(item.storeId) : null

      const orderItemDoc = await OrderItemModel.create({
        _id: new ObjectId(),
        order: order._id,
        product: item.productId,
        user: user._id,
        quantity: item.quantity,
        amount: product?.finalPrice,
        discountAmount: item.discountAmount ?? 0,
        davaCoinsUsed: item?.davaCoinsUsed ?? 0,
        gstDetails: gstDetails?.totalRate > 0 ? gstDetails : null,
        suggestedStoreId,
        suggestedBatchNo: item.batchNo,
        isPrescriptionRequired: product?.prescriptionReq ?? false
      })

      checkoutOrderItems.push(orderItemDoc.toObject())
    }

    // Create checkout session (payment gateway)
    const paymentInfo = await createCheckoutSession({
      order,
      orderItems: checkoutOrderItems,
      user: params.user,
      data
    })

    // Final return: order + payment info
    return {
      ...order,
      paymentForm: paymentInfo?.paymentForm,
      paymentOrderId: paymentInfo?.id,
      paymentDetails: paymentInfo?.paymentDetails
    }
  }

  async checkCourierServiceability(orderedItems: any, userAddress: any) {
    try {
      // Group items by storeId (no duplicates)
      const storesMap = new Map<string, any[]>()
      orderedItems.forEach((item: any) => {
        const storeId = item.storeId
        if (!storesMap.has(storeId)) {
          storesMap.set(storeId, [])
        }
        storesMap.get(storeId)?.push(item)
      })

      for (const [storeId] of storesMap.entries()) {
        const sourceStore: any = await StoreModel.findById(storeId).select('pincode coordinates').lean()

        if (!sourceStore) throw new Error('STORE_NOT_AVAILABLE')

        const partnerCouriers = await LogisticsAggregator.getAggregator(
          'shiprocketQuick' as any
        ).courierServiceability({
          pickupPostcode: sourceStore?.pincode,
          latFrom: sourceStore?.coordinates?.latitude,
          longFrom: sourceStore?.coordinates?.longitude,
          deliveryPostcode: userAddress?.postalCode,
          latTo: userAddress?.coordinates?.latitude,
          longTo: userAddress?.coordinates?.longitude
        })

        if (!partnerCouriers) {
          throw new Error(`LOCATION_NOT_SERVICEABLE`)
        }
      }
    } catch (e) {
      throw new Error('LOCATION_NOT_SERVICEABLE')
    }
  }

  async getAvailableStore(stores: any[], items: any[]) {
    // Map to store required product quantities
    const productStockMap = new Map()
    items.forEach((p: any) => {
      if (p.productId) {
        productStockMap.set(p.productId.toString(), p.quantity)
      }
    })

    const storeIds = stores.map((s: any) => s._id)

    // Fetch inventory with stock adjusted for soft holds
    const storeInventory = await StoreInventoryModel.aggregate([
      {
        $match: {
          storeId: { $in: storeIds },
          productId: { $in: items.map((i: any) => i.productId) },
          stock: { $gt: 0 },
          $expr: {
            $gte: [
              {
                $subtract: [
                  {
                    $subtract: [
                      '$stock',
                      { $ifNull: ['$softHoldCount', 0] } // First subtraction
                    ]
                  },
                  { $ifNull: ['$softHoldForOrderCount', 0] } // Second subtraction
                ]
              }, // Result of the subtraction
              0 // Ensure stock is greater than 0
            ]
          }
        }
      },
      {
        $project: {
          storeId: 1,
          productId: 1,
          stock: 1,
          softHoldCount: 1,
          softHoldForOrderCount: 1,
          batches: 1
        }
      }
    ])

    const storeMetaMap = new Map(
      stores.map((store: any) => [
        store._id.toString(),
        {
          pincode: store.pincode,
          coordinates: store.coordinates
        }
      ])
    )

    const storeMap: Map<
      string,
      {
        storeId: any
        items: {
          productId: any
          requiredQuantity: number
          batch: any
        }[]
        pincode: any
        coordinates: any
      }
    > = new Map()

    // ✅ Track all matched product IDs here
    const foundProductIds = new Set<string>()

    for (const record of storeInventory) {
      const { storeId, productId, batches, stock } = record
      const productKey = productId.toString()
      const requiredQuantity = productStockMap.get(productKey)
      if (!requiredQuantity) continue

      // Check stock with requiredQuantity
      if (stock < requiredQuantity) continue

      // Track found product
      foundProductIds.add(productKey)

      // Store result
      const storeKey = storeId.toString()

      if (!storeMap.has(storeKey)) {
        const storeMeta: any = storeMetaMap.get(storeKey) || {}
        storeMap.set(storeKey, {
          storeId,
          items: [],
          pincode: storeMeta.pincode || null,
          coordinates: storeMeta.coordinates || null
        })
      }

      storeMap.get(storeKey)!.items.push({
        productId,
        requiredQuantity,
        batch: (batches || []).find((batch: any) => batch.stock >= requiredQuantity)
      })
    }

    // 🔍 Check if all required products were matched
    for (const productId of productStockMap.keys()) {
      if (!foundProductIds.has(productId)) {
        throw new Error('ONE_OR_MORE_ITEMS_OUT_OF_STOCK')
      }
    }

    // ✅ Return final result
    return Array.from(storeMap.values())
  }

  isDeliveryModeAvailable = (deliveryPolicy: any, deliveryMode: string): boolean => {
    if (!deliveryPolicy) return false

    const availabilityFlags: Record<string, boolean> = {
      oneDay: deliveryPolicy.isOneDayDeliveryAvailable,
      standard: deliveryPolicy.isStandardDeliveryAvailable
      // Add more delivery modes if needed
    }

    return availabilityFlags[deliveryMode] ?? false
  }

  async getActiveStores(deliveryPolicy: any, zipCode: any) {
    const stores = await StoreModel.find({
      _id: { $in: deliveryPolicy?.stores },
      active: true,
      $or: [{ deleted: { $exists: false } }, { deleted: false }],
      serviceableZip: { $in: parseInt(zipCode?.zipCode ? zipCode?.zipCode : zipCode) }
    }).lean()

    await getStore(deliveryPolicy?._id.toString(), stores)
    return stores
  }

  async patch() {}

  async remove() {}

  async getOrderItemsByStore(order: any) {
    const consumerVisibleActivities = await AppDataModel.find({
      type: APP_DATA_CONSTANTS.TYPE.TRACKING_STATUS,
      visibility: 'consumer'
    }).lean()
    const statusCodes = consumerVisibleActivities.map((a) => a.statusCode)

    const orderItems = await OrderItemModel.aggregate([
      { $match: { order: order._id } },
      // Lookup to populate product details
      {
        $lookup: {
          from: 'products', // The name of the products collection
          localField: 'product', // Field in the orderTrackingItem collection
          foreignField: '_id', // Field in the products collection
          as: 'productDetails' // Name of the field to store joined data
        }
      },
      // Unwind product details to simplify access
      {
        $unwind: '$productDetails'
      },
      // Lookup to populate order tracking details
      {
        $lookup: {
          from: 'order-item-tracking', // The name of the orderTracking collection
          let: { orderTrackingId: '$orderTracking' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$orderTrackingId'] },
                    { $ne: ['$isDeleted', true] } // ✅ filter out deleted trackings
                  ]
                }
              }
            }
          ],
          as: 'orderTrackingDetails'
        }
      },
      // Unwind order tracking details
      {
        $unwind: '$orderTrackingDetails'
      },
      // Group by orderTrackingId
      {
        $group: {
          _id: '$orderTracking',
          trackingDetails: { $first: '$orderTrackingDetails' }, // Include tracking details in the group
          items: {
            $push: {
              _id: '$_id',
              title: '$productDetails.title',
              description: '$productDetails.description',
              thumbnail: '$productDetails.thumbnail',
              amount: '$amount',
              quantity: '$quantity',
              isCancelRequested: '$isCancelRequested',
              isReturnRequested: '$isReturnRequested',
              aboutProduct: {
                finalPrice: '$productDetails.finalPrice',
                maximumRetailPrice: '$productDetails.maximumRetailPrice',
                discount: '$productDetails.discount',
                discountType: '$productDetails.discountType',
                hasVariation: '$productDetails.hasVariation',
                brandTags: '$productDetails.brandTags',
                collections: '$productDetails.collections',
                composition: '$productDetails.compositions',
                consumption: '$productDetails.consumption',
                prescriptionReq: '$productDetails.prescriptionReq',
                maxOrderQuantity: '$productDetails.maxOrderQuantity',
                minOrderQuantity: '$productDetails.minOrderQuantity',
                images: '$productDetails.images',
                tags: '$productDetails.tags',
                taxAmount: '$productDetails.taxAmount',
                seo: '$productDetails.seo',
                suitableFor: '$productDetails.suitableFor',
                dosage: '$productDetails.dosage',
                cautions: '$productDetails.cautions',
                benefits: '$productDetails.benefits',
                thumbnail: '$productDetails.thumbnail',
                info: '$productDetails.info',
                _id: '$productDetails._id',
                isActive: '$productDetails.isActive'
              }
            }
          },
          totalQuantity: { $sum: '$quantity' },
          totalAmount: { $sum: { $multiply: ['$quantity', '$amount'] } }
        }
      },
      {
        $project: {
          _id: 0, // Hide the _id field if you don't need it
          orderTracking: '$_id',
          trackingDetails: 1,
          items: 1,
          totalQuantity: 1,
          totalAmount: 1
        }
      }
    ])
    if (orderItems.length) {
      for (const item of orderItems) {
        const {
          trackingDetails: { timeline }
        } = item
        item.trackingDetails.timeline = timeline.filter((t: any) => statusCodes.includes(t.statusCode))
      }
    }
    return orderItems
  }
}

export class OrderConsultationService {
  constructor() {}

  async find() {}

  async get() {}

  async totalCartPrice(items: any) {
    try {
      let totalPrice = 0
      for (const item of items) {
        if (item?.isSelected) {
          const product = await ProductsModel.findById(item?.productId).select('unitPrice').lean()
          if (product) totalPrice = totalPrice + product?.unitPrice * item?.quantity
        }
      }
      return totalPrice
    } catch (error) {
      throw error
    }
  }

  async create(data: any, params: any) {
    try {
      const user = params?.user
      const orderId = params.route.orderid
      const order = await OrderModel.findById(orderId).lean()
      if (!order) throw new BadRequest('Invalid order')
      const zipCode = data?.zipCode
      let deliveryCharges: any = 0
      let freeMinOrderValue: number = 0
      let allocateStoreId: any = null
      let taxAmount = null
      let discountAmount = 0
      let items = order.items as any[]
      if (!items) throw new BadRequest('No products found')
      const allocateStoreForProducts = items.filter((item: any) => !item.storeId)

      const allocatedStores = []

      if (allocateStoreForProducts.length !== items.length) {
        allocatedStores.push(...items.map((item: any) => item.storeId))
      }

      for (const item of items) {
        // Fetch product
        const product = await ProductsModel?.findById(item?.productId)
          .select('_id taxes finalPrice')
          .populate('taxes')
          .lean()

        if (product) {
          item.taxes = product?.taxes
          // TODO - Call that function to calc taxes
          if (product?.taxes?.length) {
            const taxCalculation = getProductTaxDetails({ ...product, quantity: item.quantity })
            item.taxAmount = taxCalculation.totalAmount ?? 0
          }
        }

        if (item?.storeId) continue

        // if store is already allocated, check if that store has the product
        let productStock = await StoreInventoryModel.find({
          storeId: { $in: allocatedStores },
          productId: item.productId,
          $expr: {
            $gt: [
              {
                $subtract: [
                  {
                    $subtract: [
                      '$stock',
                      { $ifNull: ['$softHoldCount', 0] } // First subtraction
                    ]
                  },
                  { $ifNull: ['$softHoldForOrderCount', 0] }
                ]
              }, // field2 - field1
              0 // only include documents where the result is > 0
            ]
          }
        }).lean()

        if (allocatedStores.length && productStock.length) {
          allocateStoreId = productStock[0]?.storeId

          const deliveryPolicy: any = await DeliveryPoliciesModel.findOne({
            postalCodes: zipCode,
            stores: productStock[0]?.storeId
          }).lean()

          freeMinOrderValue = deliveryPolicy?.freeMinOrderValue

          item.deliveryDate = deliveryPolicy?.expectedDeliveryTime ?? null
          if (item.isSelected && !deliveryCharges) {
            deliveryCharges = deliveryPolicy?.deliveryCharges
          }
        } else {
          const deliveryPolicy = await DeliveryPoliciesModel.findOne({ postalCodes: zipCode }).lean()

          if (!deliveryPolicy) item.isNotDeliverable = true
          else {
            freeMinOrderValue = deliveryPolicy?.freeMinOrderValue
            item.deliveryDate = deliveryPolicy?.expectedDeliveryTime ?? null

            const productStock = await StoreInventoryModel.find({
              storeId: { $in: deliveryPolicy?.stores },
              productId: item.productId,
              $expr: {
                $gt: [
                  {
                    $subtract: [
                      {
                        $subtract: [
                          '$stock',
                          { $ifNull: ['$softHoldCount', 0] } // First subtraction
                        ]
                      },
                      { $ifNull: ['$softHoldForOrderCount', 0] } // Second subtraction
                    ]
                  }, // field2 - field1
                  0 // only include documents where the result is > 0
                ]
              }
            }).lean()

            if (!productStock?.length) item.isOutOfStock = true
            else {
              if (productStock.length) {
                const getRandomElement = (arr: any) => arr[Math.floor(Math.random() * arr.length)]
                const available = productStock.filter(
                  (ps: any) => ps.stock - (ps.softHoldCount ?? 0) >= item.quantity
                )
                if (!available.length) throw new Error('Enough quantity not available')
                const availableStore = getRandomElement(available)
                allocateStoreId = availableStore.storeId
              }

              if (item.isSelected && !deliveryCharges) {
                deliveryCharges = deliveryCharges + deliveryPolicy?.deliveryCharges
              }
            }
          }
        }
        item.storeId = allocateStoreId
      }
      taxAmount = items?.reduce((acc: any, i: any) => (acc += i.taxAmount ?? 0), 0)

      const totalCartPrice = await this.totalCartPrice(items)
      if (totalCartPrice > freeMinOrderValue) {
        deliveryCharges = 0
      }

      if (data?.couponCode) {
        try {
          // Use create method (POST) to avoid issues with large item arrays
          const updatedDiscount = await app.service('apply-coupon').create(
            {
              couponCode: data?.couponCode,
              channel: 'webApp',
              totalAmount: totalCartPrice,
              zipCode: zipCode,
              items: items
            },
            { user: params?.user }
          )

          discountAmount = updatedDiscount?.discountValue
        } catch (e) {
          discountAmount = 0
        }
      }
      const subTotal = order?.orderTotal
      const totalAmount = subTotal - discountAmount + deliveryCharges

      const paymentGateway = new PAYMENT_GATEWAY_MAPPER['razorpay']()
      const paymentOrder = await paymentGateway.initOrder({
        currency: 'INR',
        paymentAmount: totalAmount,
        userId: user?._id.toString(),
        paymentType: 'online',
        userSocketId: data?.userSocketId || '',
        orderId: ''
      })
      await OrderModel.findByIdAndUpdate(order?._id, {
        addressId: data?.addressId,
        orderTotal: totalAmount,
        subTotal: subTotal,
        paymentOrderId: paymentOrder.id,
        paymentAmount: totalAmount,
        userId: user?._id,
        status: 'pending',
        discountedAmount: discountAmount ?? 0,
        deliveryCharge: deliveryCharges ?? 0,
        taxAmount: taxAmount ?? 0,
        paymentMode: 'razorpay',
        address: data?.address,
        isPrescriptionAccepted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        orderType: 'consultation'
      })
      const updatedOrder = await OrderModel.findById(order?._id).lean()
      if (items && items.length) {
        for (const [index, item] of items.entries()) {
          const product = await ProductsModel.findById(item?.productId).lean()
          const newOrderItem = new OrderItemModel({
            _id: new ObjectId(),
            order: updatedOrder?._id,
            product: item?.productId,
            user: user?._id,
            quantity: item?.quantity,
            amount: product?.finalPrice,
            isPrescriptionRequired: product?.prescriptionReq ?? false
          })
          const orderItemTracking = await OrderItemTrackingModal.findOne({
            order: updatedOrder?._id,
            store: item?.storeId,
            isDeleted: { $ne: true }
          }).lean()
          let newOrderItemTracking = null
          if (orderItemTracking) {
            newOrderItemTracking = await OrderItemTrackingModal.findOneAndUpdate(
              { _id: orderItemTracking?._id, isDeleted: { $ne: true } },
              {
                $push: {
                  items: newOrderItem?.id
                }
              }
            )
          } else {
            newOrderItemTracking = await OrderItemTrackingModal.create({
              type: ORDER_TRACKING_CONSTANTS.TRACKING_TYPE.ORDER,
              items: [newOrderItem.id],
              order: updatedOrder?._id,
              status: 'pending',
              store: item?.storeId,
              timeline: [],
              splitTrackingId: `${index + 1}`
            })
          }
          newOrderItem.set({ orderTracking: newOrderItemTracking?._id })
          await newOrderItem.save()
        }
      }
      return updatedOrder
    } catch (error) {
      throw error
    }
  }

  async patch() {}

  async remove() {}
}

export class ReturnOrderService {
  constructor() {}

  async create(data: any, params: any) {
    const { order, orderItem, productTracking, reason, note, images, isPartialReturn } = data // order, orderItem coming from hook
    console.log('🚀 ~ ReturnOrderService ~ create ~ isPartialReturn:', isPartialReturn)

    if (isPartialReturn) {
      return await partialReturnOrderItem({
        ...data,
        user: params?.user
      })
    }

    const partialReturnItems = await OrderItemModel.find({
      order: order._id,
      product: orderItem.product,
      isPartialReturnRequested: true,
      isReturnQtyModified: { $ne: true }
    })
      .select('_id quantity')
      .lean()

    const totalPartialReturnRequested = partialReturnItems?.reduce((acc, it) => acc + it.quantity, 0)
    console.log('🚀 ~ partialReturnOrderItem ~ totalPartialReturnRequested:', totalPartialReturnRequested)

    if (totalPartialReturnRequested > 0)
      throw new BadRequest(
        'Cannot cancel whole product since some items has been requested for partial return'
      )

    const returnActivity = await AppDataModel.findOne({
      type: 'order-tracking-status',
      statusCode: 'return_to_origin'
    }).lean()

    const orderDoc: any = await OrderModel.findById(order?._id).populate('userId', '_id name').lean()

    const returnOrderTracking = (
      await OrderItemTrackingModal.create({
        parentOrderTracking: productTracking?._id,
        type: ORDER_TRACKING_CONSTANTS.TRACKING_TYPE.RETURN,
        items: [orderItem._id],
        store: productTracking.store,
        order: order._id,
        status: 'pending',
        timeline: [
          {
            authorType: 'user',
            authorId: orderDoc?.userId?._id,
            authorName: orderDoc?.userId?.name,
            statusCode: 'return_to_origin',
            label: returnActivity?.name,
            date: new Date(),
            comment: `${reason} ${note ? '- ' + note : ''}`
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
      })
    ).toObject()

    const updateData = {
      isReturnRequested: true,
      returnDetails: {
        reason,
        comment: note,
        images
      },
      orderTracking: returnOrderTracking._id
    }
    await OrderItemModel.findByIdAndUpdate(orderItem._id, { ...updateData })

    const issueParentCategory = getTicketIssueParentCategory(reason)

    // TODO add this user role
    let assignee: any = null
    const supportUsers = await getUsersWithSupportTicketPermission(reason)
    if (supportUsers?.length)
      assignee = new Types.ObjectId(supportUsers[Math.floor(Math.random() * supportUsers.length)])

    const ticket: any = {
      ticketId: await createTicketId(),
      order: order?._id,
      comment: note,
      issue: reason,
      issueParentCategory,
      status: TICKET_CONSTANTS.TICKET_STATUS.OPEN,
      createdBy: params.user._id,
      createdByUserType:
        params.user.role === 'super-admin'
          ? TICKET_CONSTANTS.CREATED_BY_USER_TYPE.SUPER_ADMIN
          : TICKET_CONSTANTS.CREATED_BY_USER_TYPE.CONSUMER,
      attachments: images,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    ticket.priority = TICKET_CONSTANTS.PRIORITY.HIGH
    ticket.dueDate = new Date()
    ticket.issueParentCategory = issueParentCategory
    ticket.assignee = assignee?._id

    const ticketDoc = (await TicketsModel.create(ticket)).toObject()

    const activity = {
      ticket: ticketDoc._id,
      createdAt: new Date(),
      createdByUserType:
        params.user.role === 'super-admin'
          ? TICKET_CONSTANTS.CREATED_BY_USER_TYPE.SUPER_ADMIN
          : TICKET_CONSTANTS.CREATED_BY_USER_TYPE.CONSUMER,
      createdBy: params.user._id,
      activity: 'ticket-created',
      attachments: images
    }

    const attachmentActivity = {
      ticket: ticketDoc._id,
      createdAt: new Date(),
      createdByUserType:
        params.user.role === 'super-admin'
          ? TICKET_CONSTANTS.CREATED_BY_USER_TYPE.SUPER_ADMIN
          : TICKET_CONSTANTS.CREATED_BY_USER_TYPE.CONSUMER,
      createdBy: params.user._id,
      activity: 'attachment-added',
      attachments: images
    }

    await TicketActivitiesModel.create([activity, attachmentActivity])

    await sendReturnNotificationToAdmin(productTracking?.store)

    return {}
  }
}

export class CancelOrderService {
  constructor() {}

  async create(data: any, params: any) {
    try {
      const { isPartialCancel } = data // order, orderItem, isPartialCancel coming from hook

      const payload = { ...data, user: params?.user }

      if (isPartialCancel) return await partialCancelOrderItem(payload)

      await cancelOrderItem(payload)

      return {}
    } catch (err) {
      throw err
    }
  }
}
export class ConsumerOrderProductsService {
  constructor() {}
  async find(params: Params) {
    try {
      const user = params.user
      if (!user?._id) return []

      const uniqueActiveProducts = await OrderItemModel.aggregate([
        // Step 1: Filter order-items by user
        {
          $match: { user: user?._id }
        },
        // Step 2: Group by product (get unique products)
        {
          $group: {
            _id: '$product'
          }
        },
        // Step 3: Lookup product details
        {
          $lookup: {
            from: 'products', // your product collection name
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        // Step 4: Unwind product array
        {
          $unwind: '$product'
        },
        // Step 5: Filter only active products
        {
          $match: { 'product.isActive': true }
        },
        // Step 6: Project final structure
        {
          $project: {
            _id: 0,
            product: 1
          }
        }
      ])

      return uniqueActiveProducts.map((p) => p.product)
    } catch (err) {
      throw err
    }
  }
}

export class TrackOrderService {
  constructor() {}

  async find(params?: undefined | any): Promise<any> {
    try {
      const { orderId, orderTrackingId, oid, ff } = params?.query

      // TODO: remove oid and ff implementation once tested
      let order

      if (ff && oid) {
        order = await OrderModel.findOne({ orderId: oid }).populate('items').lean()
      } else {
        order = await OrderModel.findById(orderId).populate('items').lean()
      }

      if (!order) throw new Error('Order not found')

      let orderTracking

      if (ff && oid) {
        orderTracking = await OrderItemTrackingModal.findOne({
          shipmentId: { $exists: true },
          order: order._id
        }).lean()
      } else {
        orderTracking = await OrderItemTrackingModal.findOne({
          _id: orderTrackingId,
          order: order._id
        }).lean()
      }

      if (!orderTracking) throw new Error('Order tracking not found')

      const store = await StoreModel.findById(orderTracking?.store).select('_id storeName coordinates').lean()

      const sortedTimeline = [...(orderTracking?.timeline ?? [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      return {
        _id: order?._id,
        orderId: order?.orderId,
        deliverMode: order?.deliveryMode,
        isTrackingEnabled: !!orderTracking?.shipmentId && order?.deliveryMode === 'oneDay',
        orderTrackingType: orderTracking?.type,
        shipmentId: orderTracking?.shipmentId,
        user: {
          name: order?.address?.userName,
          phone: order?.address?.phoneNumber,
          location: {
            lat: order?.address?.coordinates?.latitude,
            lng: order?.address?.coordinates?.longitude
          }
        },
        store: {
          name: store?.storeName,
          location: {
            lat: store?.coordinates?.latitude,
            lng: store?.coordinates?.longitude
          }
        },
        etaMinutes: 25,
        status: orderTracking?.lastTimelineStatus,
        lastActivityDateTime: sortedTimeline[0]?.date,
        timeline: sortedTimeline,
        createdAt: order?.createdAt,
        address: order?.address
      }
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('order'))
  }
}

// Local only for test purpose, don't enable in staging and production
// const dummy: any = {
//   orderId: order?._id,
//   paymentOrderId: paymentInfo?.id,
//   status: 'captured',
//   notes: {
//     orderId: order?._id?.toString()
//   },
//   paymentFor: 'order'
// }

// await onPaymentCaptured(dummy)
