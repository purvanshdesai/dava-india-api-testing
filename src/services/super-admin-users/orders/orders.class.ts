// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { NullableId, Params, ServiceInterface } from '@feathersjs/feathers'
import type { AdapterId, MongoDBAdapterOptions, MongoDBAdapterParams } from '@feathersjs/mongodb'
import { MongoDBService } from '@feathersjs/mongodb'

import { BadRequest } from '@feathersjs/errors'
import dayjs from 'dayjs'
import moment from 'moment'
import { Types } from 'mongoose'
import { trackEvent } from '../../../analytics/index'
import { trackOrderCancelled } from '../../../analytics/trackers/index'
import type { Application } from '../../../declarations'
import { onPaymentCaptured } from '../../../payments/utils'
import { excludeFieldsInObject } from '../../../utils'
import { manageProductQuantityFromOrderTrackingId, releaseOrderSoftHold } from '../../../utils/inventory'
import {
  buildCancelReturnIndex,
  buildInventoryPairs,
  enrichOrderTrackings,
  fetchInventories,
  fetchOrder,
  fetchPaymentTrackingsRefunds,
  key
} from '../../../utils/orderUtility'
import { AppDataModel, CONSTANTS } from '../../app-data/app-data.schema'
import {
  CONSTANTS as ORDER_ITEM_TRACKING_CONSTANTS,
  OrderItemTrackingModal
} from '../../order-item-tracking/order-item-tracking.schema'
import { OrderItemModel } from '../../order-items/order-items.schema'
import { CheckoutSessionModel, OrderModel } from '../../order/order.schema'
import { cancelOrderItem, partialCancelOrderItem } from '../../order/utils'
import { PaymentModel } from '../../payment/payment.schema'
import { StoreInventoryModel } from '../../store-inventory/store-inventory.schema'
import { ProductsModel } from '../../super-admin/products/products.schema'
import { createConsumerTicket } from '../../tickets/tickets.class'
import type {
  SuperAdminOrders,
  SuperAdminOrdersData,
  SuperAdminOrdersPatch,
  SuperAdminOrdersQuery
} from './orders.schema'
import { getPartialItemDiscount } from '../../order-items/order-items.shared'
import { processProductPartialCancellationWithDavaCoins } from '../../../utils/davaCoins'
import { UsersModel } from '../../users/users.schema'
import { StoreModel } from '../../stores/stores.schema'

export type { SuperAdminOrders, SuperAdminOrdersData, SuperAdminOrdersPatch, SuperAdminOrdersQuery }

export interface SuperAdminOrdersParams extends MongoDBAdapterParams<SuperAdminOrdersQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
// Helper functions for cleaner code
const isUserFieldCondition = (condition: any): boolean => {
  return 'userId.email' in condition || 'userId.phoneNumber' in condition
}

const isStoreFieldCondition = (condition: any): boolean => {
  return 'store.storeCode' in condition
}

const extractRegexSearchTerm = (condition: any): string | null => {
  if (condition['userId.email']?.$regex) return condition['userId.email'].$regex
  if (condition['userId.phoneNumber']?.$regex) return condition['userId.phoneNumber'].$regex
  if (condition['orderId']?.$regex) return condition['orderId'].$regex
  if (condition['store.storeCode']?.$regex) return condition['store.storeCode'].$regex
  return null
}

const separateSearchConditions = (orConditions: any[]) => {
  const orderIdSearches: any[] = []
  const userFieldSearches: any[] = []
  const storeFieldSearches: any[] = []

  for (const condition of orConditions) {
    if (isUserFieldCondition(condition)) {
      userFieldSearches.push(condition)
    } else if (isStoreFieldCondition(condition)) {
      storeFieldSearches.push(condition)
    } else {
      orderIdSearches.push(condition)
    }
  }

  return { orderIdSearches, userFieldSearches, storeFieldSearches }
}

export class SuperAdminOrdersService<
  ServiceParams extends Params = SuperAdminOrdersParams
> extends MongoDBService<
  SuperAdminOrders,
  SuperAdminOrdersData,
  SuperAdminOrdersParams,
  SuperAdminOrdersPatch
> {
  async find(params?: any): Promise<any> {
    try {
      const query = params?.query || {}

      // Normalize deliveryMode single-element arrays
      if (Array.isArray(query.deliveryMode) && query.deliveryMode.length === 1) {
        query.deliveryMode = query.deliveryMode[0]
      }

      // Normalize timelineStatus to always be an array
      if (query.timelineStatus && !Array.isArray(query.timelineStatus)) {
        query.timelineStatus = [query.timelineStatus]
      }

      // Normalize paymentMethod to always be an array
      if (query.paymentMethod && !Array.isArray(query.paymentMethod)) {
        query.paymentMethod = [query.paymentMethod]
      }

      // Remove fields that shouldn't be part of the base match
      const baseQuery = excludeFieldsInObject(
        [
          '$limit',
          '$skip',
          '$sort',
          'paymentMethod',
          'dateRange',
          'timelineStatus',
          'userId.hasDavaoneMembership',
          'userId',
          'excludeOrderId'
        ],
        query
      )

      const matchStage: any = { ...baseQuery }

      // Handle userId filter - convert to ObjectId
      if (query.userId) {
        try {
          matchStage.userId = new Types.ObjectId(query.userId)
        } catch (error) {
          console.error('Invalid userId format:', error)
        }
      }

      // Handle excludeOrderId filter
      if (query.excludeOrderId) {
        try {
          matchStage._id = { $ne: new Types.ObjectId(query.excludeOrderId) }
        } catch (error) {
          console.error('Invalid excludeOrderId format:', error)
        }
      }

      // Payment aggregation (lookup payments if paymentMethod filter exists)
      let paymentAggregation: any[] = []
      if (query?.paymentMethod?.length) {
        const paymentMethodFilter = { 'payment.paymentResponse.method': { $in: query.paymentMethod } }
        paymentAggregation = [
          {
            $lookup: {
              from: 'payments',
              localField: '_id',
              foreignField: 'order',
              as: 'payment'
            }
          },
          {
            $addFields: {
              payment: { $arrayElemAt: ['$payment', 0] }
            }
          },
          { $match: paymentMethodFilter }
        ]
      }

      // Timeline status aggregation (lookup order-item-tracking if timelineStatus filter exists)
      let timelineStatusAggregation: any[] = []
      if (query?.timelineStatus?.length) {
        timelineStatusAggregation = [
          {
            $lookup: {
              from: 'order-item-tracking',
              localField: '_id',
              foreignField: 'order',
              as: 'orderItemTracking'
            }
          },
          {
            $match: {
              orderItemTracking: {
                $elemMatch: {
                  lastTimelineStatus: { $in: query.timelineStatus }
                }
              }
            }
          }
        ]
      }

      const TZ = 'Asia/Kolkata'

      // Build createdAt match using provided dateRange fields (multiple formats supported)
      const buildCreatedAtMatch = (f: any) => {
        if (!f?.dateRange) return null
        const dr = f.dateRange
        const startInput = dr.start ?? dr.from ?? dr.gte ?? dr[0]
        const endInput = dr.end ?? dr.to ?? dr.lte ?? dr[1]

        const match: any = {}
        if (startInput) {
          match.$gte = moment.tz(startInput, TZ).startOf('day').toDate()
        }
        if (endInput) {
          // use exclusive upper bound of next day start
          match.$lt = moment.tz(endInput, TZ).add(1, 'day').startOf('day').toDate()
        }

        return Object.keys(match).length ? match : null
      }

      const createdAtMatch = buildCreatedAtMatch(query)
      if (createdAtMatch) matchStage.createdAt = createdAtMatch

      // ============ THREE-LAYER SEARCH STRATEGY ============
      // Layer 1: Search by orderId (fast, direct match)
      // Layer 2: Search by user fields (requires pre-filtering users collection)
      // Layer 3: Search by store fields (requires pre-filtering stores and order-item-tracking)

      let orderIdFilters: any[] = []
      let userIdFilters: any = null
      let storeOrderIdFilters: any = null
      let statusFilters: any[] = []

      // Process $or conditions (search queries)
      if (matchStage.$or) {
        const { orderIdSearches, userFieldSearches, storeFieldSearches } = separateSearchConditions(
          matchStage.$or
        )

        // Layer 1: OrderId search - direct match on orders collection
        if (orderIdSearches.length > 0) {
          orderIdFilters.push(...orderIdSearches)
        }

        // Layer 2: User field search - pre-filter users first
        if (userFieldSearches.length > 0) {
          const searchTerm = extractRegexSearchTerm(userFieldSearches[0])

          if (searchTerm) {
            const matchingUsers = await UsersModel.find({
              $or: [
                { email: { $regex: searchTerm, $options: 'i' } },
                { phoneNumber: { $regex: searchTerm, $options: 'i' } }
              ]
            })
              .select('_id')
              .limit(1000)
              .lean()
              .exec()

            const userIds = matchingUsers.map((u: any) => u._id)

            if (userIds.length > 0) {
              userIdFilters = { userId: { $in: userIds } }
            }
          }
        }

        // Layer 3: Store field search - pre-filter stores first, then find orders via order-item-tracking
        if (storeFieldSearches.length > 0) {
          const searchTerm = extractRegexSearchTerm(storeFieldSearches[0])

          if (searchTerm) {
            const matchingStores = await StoreModel.find({
              $or: [{ storeCode: { $regex: searchTerm, $options: 'i' } }]
            })
              .select('_id')
              .limit(1000)
              .lean()
              .exec()

            const storeIds = matchingStores.map((s: any) => s._id)

            if (storeIds.length > 0) {
              // Find orders that have these stores in order-item-tracking
              const orderTrackings = await OrderItemTrackingModal.find({
                store: { $in: storeIds },
                isDeleted: { $ne: true }
              })
                .select('order')
                .limit(10000)
                .lean()
                .exec()

              const orderIdsFromStores = orderTrackings.map((t: any) => t.order)

              if (orderIdsFromStores.length > 0) {
                storeOrderIdFilters = { _id: { $in: orderIdsFromStores } }
              }
            }
          }
        }

        // Early return if no matches found for any search type
        if (
          userFieldSearches.length > 0 &&
          storeFieldSearches.length > 0 &&
          orderIdFilters.length === 0 &&
          !userIdFilters &&
          !storeOrderIdFilters
        ) {
          return { total: 0, data: [] }
        }
      }

      // Process $and conditions (search + status filters)
      if (matchStage.$and) {
        for (const andCondition of matchStage.$and) {
          if (andCondition.$or) {
            const { orderIdSearches, userFieldSearches, storeFieldSearches } = separateSearchConditions(
              andCondition.$or
            )

            // Status filters are in $or format
            if (orderIdSearches.length > 0 && orderIdSearches[0].status) {
              statusFilters.push(...orderIdSearches)
            } else if (orderIdSearches.length > 0) {
              orderIdFilters.push(...orderIdSearches)
            }
          } else {
            // Other filters (non-search)
            Object.assign(matchStage, andCondition)
          }
        }
      }

      // Build clean aggregation match stages
      const finalMatchStage: any = {}

      // Add all direct filters (status, createdAt, etc.)
      for (const [key, value] of Object.entries(matchStage)) {
        if (key !== '$or' && key !== '$and') {
          finalMatchStage[key] = value
        }
      }

      // Combine search conditions intelligently
      // Search conditions (orderId + user fields + store fields) should be combined with $or
      // Status filters should be combined with $and

      const searchConditions: any[] = []

      // Combine orderId, user, and store searches with $or (user searching for orderId OR email OR phone OR store)
      if (orderIdFilters.length > 0) {
        searchConditions.push(...orderIdFilters)
      }
      if (userIdFilters) {
        searchConditions.push(userIdFilters)
      }
      if (storeOrderIdFilters) {
        searchConditions.push(storeOrderIdFilters)
      }

      // Apply combined search conditions
      if (searchConditions.length > 1) {
        finalMatchStage.$or = searchConditions
      } else if (searchConditions.length === 1) {
        Object.assign(finalMatchStage, searchConditions[0])
      }

      // Status filters are combined with $and (must match status AND search)
      if (statusFilters.length > 0) {
        if (finalMatchStage.$or) {
          // If we have search conditions, combine with status using $and
          finalMatchStage.$and = [{ $or: finalMatchStage.$or }, { $or: statusFilters }]
          delete finalMatchStage.$or
        } else {
          // No search conditions, just apply status filter
          if (statusFilters.length === 1) {
            Object.assign(finalMatchStage, statusFilters[0])
          } else {
            finalMatchStage.$or = statusFilters
          }
        }
      }

      // Replace old matchStage with clean one
      const nonUserFieldMatch = finalMatchStage
      const userIdFilter = userIdFilters

      // User lookup is always needed to populate user fields in response
      const userAggregation: any[] = [
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userId',
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  email: 1,
                  phoneNumber: 1,
                  hasDavaoneMembership: 1
                }
              }
            ]
          }
        },
        { $unwind: '$userId' }
      ]

      // Build the $lookup-based membership filter if requested
      const hasDavaoneMembershipValue = query['userId.hasDavaoneMembership']
      const hasMembershipFilter =
        hasDavaoneMembershipValue !== undefined && hasDavaoneMembershipValue !== null

      const userMembershipLookup = hasMembershipFilter
        ? [
            {
              // For each order, attempt to find a matching user with the requested membership flag
              $lookup: {
                from: 'users',
                let: { uId: '$userId' },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$_id', '$$uId'] },
                          { $eq: ['$hasDavaoneMembership', Boolean(hasDavaoneMembershipValue)] }
                        ]
                      }
                    }
                  },
                  // Only project minimal fields to keep the lookup light
                  { $project: { _id: 1, hasDavaoneMembership: 1 } }
                ],
                as: 'matchedUser'
              }
            },
            // Keep only orders where the lookup found a matching user
            { $match: { matchedUser: { $ne: [] } } },
            // Optional: unwind matchedUser if you need its fields later (we preserve only matched existence)
            { $unwind: { path: '$matchedUser', preserveNullAndEmptyArrays: false } }
          ]
        : []

      // Detect if we have search/filters that require expensive lookups
      const hasSearchOrFilters =
        orderIdFilters.length > 0 ||
        userIdFilters !== null ||
        storeOrderIdFilters !== null ||
        statusFilters.length > 0 ||
        hasMembershipFilter ||
        query.paymentMethod?.length ||
        query.timelineStatus?.length

      // Build OPTIMIZED aggregation pipeline
      let aggregationPipeline: any[] = []

      if (!hasSearchOrFilters) {
        // ⚡ FAST PATH: No search/filters - Paginate BEFORE expensive lookups
        aggregationPipeline = [
          // Apply basic filters
          ...(Object.keys(nonUserFieldMatch).length > 0 ? [{ $match: nonUserFieldMatch }] : []),

          // Sort and paginate FIRST (uses indexes)
          { $sort: query?.$sort || { _id: -1 } },
          { $skip: query?.$skip || 0 },
          ...(query?.$limit ? [{ $limit: query.$limit }] : [{ $limit: 10 }]),

          // User lookup ONLY on paginated results
          ...userAggregation
        ]
      } else {
        // 🔍 SEARCH/FILTER PATH: Need lookups for filtering
        aggregationPipeline = [
          // Apply date filter first
          ...(Object.keys(nonUserFieldMatch).length > 0 ? [{ $match: nonUserFieldMatch }] : []),

          // Apply pre-filtered user IDs
          ...(userIdFilter ? [{ $match: userIdFilter }] : []),

          // User lookup needed for filtering
          ...userAggregation,

          // Membership filter
          ...userMembershipLookup,

          // Payment & timeline lookups
          ...paymentAggregation,
          ...timelineStatusAggregation,

          // Sort and paginate after filtering
          { $sort: query?.$sort || { _id: -1 } },
          {
            $facet: {
              data: [{ $skip: query?.$skip || 0 }, ...(query?.$limit ? [{ $limit: query.$limit }] : [])],
              totalCount: [{ $count: 'count' }]
            }
          }
        ]
      }

      // Execute aggregation
      let data: any[]
      let total: number

      if (!hasSearchOrFilters) {
        // Fast path: Data is already in array format, need separate count query
        data = await OrderModel.aggregate(aggregationPipeline).allowDiskUse(true).exec()

        // Get total count separately (fast, no expensive lookups)
        const countPipeline = [
          ...(Object.keys(nonUserFieldMatch).length > 0 ? [{ $match: nonUserFieldMatch }] : []),
          { $count: 'count' }
        ]
        const [countResult] = await OrderModel.aggregate(countPipeline).exec()
        total = countResult?.count || 0
      } else {
        // Search/filter path: Data is in facet format
        const [result] = await OrderModel.aggregate(aggregationPipeline).allowDiskUse(true).exec()
        data = result?.data || []
        total = result?.totalCount?.[0]?.count || 0
      }

      // If no orders, return early
      if (!data.length) {
        return { total: 0, data: [] }
      }

      // Fetch tracking data for the returned orders in a single query
      const orderIds = data.map((o: any) => o._id)
      const trackingDocs = await OrderItemTrackingModal.find({
        order: { $in: orderIds },
        isDeleted: { $ne: true }
      })
        .populate('store')
        .lean()
        .exec()

      // Build a map of orderId -> tracking docs
      const trackingMap: any = new Map<string, any[]>()
      for (const doc of trackingDocs) {
        const key = doc.order.toString()
        if (!trackingMap.has(key)) trackingMap.set(key, [doc])
        else trackingMap.get(key).push(doc)
      }

      // Enrich orders with derived tracking info
      const enrichedOrders = data.map((order: any) => {
        const trackings = trackingMap.get(order._id.toString()) || []
        const statusLabels = trackings.map((t: any) => t?.timeline?.at(-1)?.label).filter(Boolean)
        const lastTimelineStatus = statusLabels.length ? statusLabels.join(' & ') : null
        const store = trackings.length > 0 ? trackings[0].store : ''

        // remove matchedUser property if present (cleanup)
        if (order.matchedUser !== undefined) {
          delete order.matchedUser
        }

        return {
          ...order,
          lastTimelineStatus,
          store
        }
      })

      return {
        total,
        data: enrichedOrders
      }
    } catch (error) {
      throw error
    }
  }

  key(storeId: any, productId: any) {
    return `${String(storeId)}:${String(productId)}`
  }

  async get(id: AdapterId, params?: SuperAdminOrdersParams): Promise<any> {
    try {
      const user = params?.user as any
      const requestStoreId = user?.storeIds?.[0]

      // 1) fetch order
      const order = await fetchOrder(id)
      if (!order) throw new BadRequest('Order not found')

      // 2) fetch payment, trackings, refunds in parallel
      const { payment, trackings, refunds } = await fetchPaymentTrackingsRefunds(order, requestStoreId)

      // 3) split types
      const allTrackings = trackings ?? []
      const onlyOrderTrackings = allTrackings.filter(
        (t) => t.type === ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.ORDER
      )
      const cancelAndReturnTrackings = allTrackings.filter((t) =>
        [
          ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.RETURN,
          ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.CANCEL,
          ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.PARTIAL_CANCEL,
          ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.PARTIAL_RETURN
        ].includes(t.type)
      )

      // 4) indexes and inventories
      const trackingByItemId = buildCancelReturnIndex(cancelAndReturnTrackings)
      const inventoryPairs = buildInventoryPairs(onlyOrderTrackings)
      const inventories = await fetchInventories(inventoryPairs)
      const invIndex = new Map<string, any>()
      for (const inv of inventories) invIndex.set(key(inv.storeId, inv.productId), inv)

      // 5) enrich order trackings (including invoice generation, bounded)
      await enrichOrderTrackings(onlyOrderTrackings, invIndex, trackingByItemId, params)

      // 6) compute totals and final shape
      const totalRefundAmount = (refunds ?? []).reduce((s, r) => s + (r.amount ?? 0), 0) / 100

      return {
        ...order,
        refundTransactionIds: refunds ? refunds.map((r) => r.paymentId) : [],
        totalRefundAmount,
        orderItemTracking: onlyOrderTrackings,
        cancelAndReturnTrackings,
        paymentTransactionId: payment?.transactionId ?? null
      }
    } catch (err) {
      throw err
    }
  }

  async patch(id: any, data: any, params?: any): Promise<any> {
    try {
      const order: any = await OrderModel.findById(id).lean()

      if (!order) throw new Error('Order not found!')

      const orderItemsTracking = await OrderItemTrackingModal.findOne({
        order: order?._id,
        isDeleted: { $ne: true }
      }).lean()

      if (!orderItemsTracking) throw new Error('Order tracking is not found')

      const res = await OrderModel.findByIdAndUpdate(id, { ...data }).lean()

      await OrderItemTrackingModal.findOneAndUpdate(
        { order: order?._id, isDeleted: { $ne: true } },
        { ...data }
      )

      return res
    } catch (error) {
      throw new Error('Error while updating the order')
    }
  }
}

export class AddProductBatchNoService<ServiceParams extends Params = SuperAdminOrdersParams>
  implements
    ServiceInterface<SuperAdminOrders, SuperAdminOrdersData, SuperAdminOrdersParams, SuperAdminOrdersPatch>
{
  constructor(public options: any) {}
  async find(params: any): Promise<any> {}
  async get(id: any, params: any): Promise<any> {}
  async create(data: any, params: any): Promise<any> {}
  async patch(id: any, data: any, params?: any): Promise<any> {
    const { orderId } = params.route
    const { storeId, productBatches = [] } = data
    const orderTracking = await OrderItemTrackingModal.findOne({
      store: new Types.ObjectId(storeId),
      order: new Types.ObjectId(orderId),
      type: 'order',
      isDeleted: { $ne: true }
    })
      .populate('items')
      .lean()
    if (!orderTracking) throw new BadRequest('Order tracking details not available')

    if (
      orderTracking.items.filter((i: any) => !i.isCancelRequested && !i.isReturnRequested).length !==
      productBatches.length
    )
      throw new BadRequest('Batch no not provided for all products')

    const inventoryFilter = productBatches.reduce((acc: any, curr: any) => {
      acc.push({
        storeId: orderTracking.store,
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

    for (const productBatch of productBatches) {
      const { batchNo, productId } = productBatch
      await OrderItemModel.findOneAndUpdate(
        { orderTracking: orderTracking._id, product: new Types.ObjectId(productId) },
        { batchNo: batchNo }
      )
      await manageProductQuantityFromOrderTrackingId(orderTracking._id.toString(), 'remove', productBatches)
    }
    await releaseOrderSoftHold({
      orderTrackingId: orderTracking._id.toString()
    })
    return {}
  }
  async remove(id: any, params: any): Promise<any> {}
}
export class CheckoutSessionFailedOrders<ServiceParams extends Params = SuperAdminOrdersParams>
  implements
    ServiceInterface<SuperAdminOrders, SuperAdminOrdersData, SuperAdminOrdersParams, SuperAdminOrdersPatch>
{
  constructor(public options: any) {}
  async find(params: any): Promise<any> {}
  async get(id: any, params: any): Promise<any> {}
  async patch(id: any, data: any, params: any): Promise<any> {}
  async remove(id: any, params: any): Promise<any> {}

  async create(data: any, params?: any): Promise<any> {
    try {
      const order = await OrderModel.findById(data?.orderId).lean()

      if (!order) throw new Error('Order not found')

      const session = await CheckoutSessionModel.findOne({
        orderId: new Types.ObjectId(data?.orderId)
      }).lean()

      if (!session) throw new Error('Checkout session not found')

      await CheckoutSessionModel.findByIdAndUpdate(session?._id, {
        status: 'active',
        sessionEndTime: dayjs().add(1, 'day').toDate()
      })

      const payment = await PaymentModel.findOneAndUpdate({ order: order?._id }, { status: 'pending' }).lean()

      const updatedData = {
        transactionId: payment?.transactionId,
        status: 'captured',
        paymentOrderId: order?.paymentOrderId,
        couponCode: order?.couponCode ?? '',
        orderId: order?._id.toString(),
        paymentType: 'online',
        userId: order?.userId,
        userSocketId: '1234',
        paymentFor: 'order'
      }

      await onPaymentCaptured(updatedData)

      await OrderModel.findByIdAndUpdate(order?._id, { isSessionFailedOrder: false })

      return updatedData
    } catch (error) {
      throw error
    }
  }
}
export class CreateTicketFromAdminService<ServiceParams extends Params = SuperAdminOrdersParams>
  implements
    ServiceInterface<SuperAdminOrders, SuperAdminOrdersData, SuperAdminOrdersParams, SuperAdminOrdersPatch>
{
  constructor(public options: any) {}

  async create(data: any, params: any): Promise<any> {
    try {
      const order: any = await OrderModel.findById(data?.orderId).populate('userId', '_id name').lean()

      if (!order) throw new Error('Order Not found')

      await OrderModel.findByIdAndUpdate(order?._id, { consultDoctorForPrescription: true })

      const prescriptionRequiredItems = await ProductsModel.find({
        _id: { $in: order.items?.map((i: any) => i.productId) },
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

      const trackingDetails = await OrderItemTrackingModal.find({
        order: order._id,
        isDeleted: { $ne: true }
      })
        .populate({ path: 'items', populate: { path: 'product' } })
        .lean()

      const prescriptionTrackingIds = trackingDetails
        .filter((tracking: any) => tracking.items?.some((item: any) => item.product?.prescriptionReq))
        .map((t: any) => t._id)

      // Use dateOfConsult and timeOfConsult from data if provided, else fallback to order
      const dateOfConsult = data.dateOfConsult || order?.dateOfConsult
      const timeOfConsult = data.timeOfConsult || order?.timeOfConsult

      // Create consumer ticket here (done outside the queue)
      await createConsumerTicket({
        order: order?._id.toString(),
        userId: order?.userId?._id?.toString(),
        issue: 'doctor-consultation',
        comment: 'Created after by system payment confirmation',
        items: itemsForTicket ?? [],
        address: '',
        prescription_url: '',
        patientId: order?.patientId,
        dateOfConsult,
        timeOfConsult,
        phoneNumber: order?.phoneNumber
      })

      // Track CleverTap event for regenerate prescription
      trackEvent('regenerate prescription', {
        orderId: order?._id?.toString(),
        orderOrderId: order?.orderId,
        userId: order?.userId?._id?.toString(),
        dateOfConsult: dateOfConsult,
        timeOfConsult: timeOfConsult,
        timestamp: new Date().toISOString()
      })

      const prescriptionUnderProcess = await AppDataModel.findOne({
        type: CONSTANTS.TYPE.TRACKING_STATUS,
        statusCode: 'prescription_being_generated'
      })

      for (const trackingId of prescriptionTrackingIds || []) {
        const tracking = await OrderItemTrackingModal.findOne({
          _id: trackingId,
          isDeleted: { $ne: true } // ✅ passes when false or not set
        }).lean()
        if (!tracking) continue

        const timeline = tracking.timeline || []

        timeline.push({
          label: prescriptionUnderProcess?.name,
          date: new Date(),
          statusCode: prescriptionUnderProcess?.statusCode,
          authorName: 'Super Admin (System)',
          authorType: 'super-admin'
        })

        await OrderItemTrackingModal.findOneAndUpdate(
          { _id: trackingId, isDeleted: { $ne: true } },
          {
            timeline,
            lastTimelineStatus: prescriptionUnderProcess?.statusCode
          }
        )
      }
      return order
    } catch (error) {
      throw error
    }
  }

  async patch(id: any, data: any, params: any): Promise<any> {
    try {
      const order: any = await OrderModel.findById(id).populate('userId', '_id name').lean()

      if (!order) throw new Error('Order Not found')

      await OrderModel.findByIdAndUpdate(order?._id, { consultDoctorForPrescription: true })

      const prescriptionRequiredItems = await ProductsModel.find({
        _id: { $in: order.items?.map((i: any) => i.productId) },
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

      const trackingDetails = await OrderItemTrackingModal.find({
        order: order._id,
        isDeleted: { $ne: true }
      })
        .populate({ path: 'items', populate: { path: 'product' } })
        .lean()

      const prescriptionTrackingIds = trackingDetails
        .filter((tracking: any) => tracking.items?.some((item: any) => item.product?.prescriptionReq))
        .map((t: any) => t._id)

      // Use dateOfConsult and timeOfConsult from data if provided, else fallback to order
      const dateOfConsult = data.dateOfConsult || order?.dateOfConsult
      const timeOfConsult = data.timeOfConsult || order?.timeOfConsult

      // Create consumer ticket here (done outside the queue)
      await createConsumerTicket({
        order: order?._id.toString(),
        userId: order?.userId?._id?.toString(),
        issue: 'doctor-consultation',
        comment: 'Created after by system payment confirmation',
        items: itemsForTicket ?? [],
        address: '',
        prescription_url: '',
        patientId: order?.patientId,
        dateOfConsult,
        timeOfConsult,
        phoneNumber: order?.phoneNumber
      })

      const prescriptionUnderProcess = await AppDataModel.findOne({
        type: CONSTANTS.TYPE.TRACKING_STATUS,
        statusCode: 'prescription_being_generated'
      })

      for (const trackingId of prescriptionTrackingIds || []) {
        const tracking = await OrderItemTrackingModal.findOne({
          _id: trackingId,
          isDeleted: { $ne: true } // ✅ passes when false or not set
        }).lean()
        if (!tracking) continue

        const timeline = tracking.timeline || []

        timeline.push({
          label: prescriptionUnderProcess?.name,
          date: new Date(),
          statusCode: prescriptionUnderProcess?.statusCode,
          authorName: 'Super Admin (System)',
          authorType: 'super-admin'
        })

        await OrderItemTrackingModal.findOneAndUpdate(
          { _id: trackingId, isDeleted: { $ne: true } },
          {
            timeline,
            lastTimelineStatus: prescriptionUnderProcess?.statusCode
          }
        )
      }
      return order
    } catch (error) {
      throw error
    }
  }
}

interface CancelItem {
  orderItemId: string
  productId: string
  cancelQuantity: string
}

type ItemResult = {
  orderItemId: string
  productId: string
  cancelQuantity: number
  status: 'ok' | 'error'
  message?: string
  details?: any
}

export class CancelOrderActionsService<ServiceParams extends Params = SuperAdminOrdersParams>
  implements
    ServiceInterface<SuperAdminOrders, SuperAdminOrdersData, SuperAdminOrdersParams, SuperAdminOrdersPatch>
{
  constructor(public options: any) {}

  async create(data: any, params?: any): Promise<any> {
    // Basic payload validation
    if (!data) throw new Error('Missing payload')
    const { orderId, items, reasonCode, notes, productTrackingId } = data

    if (!orderId || typeof orderId !== 'string') {
      throw new Error('orderId is required and must be a string')
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('items must be a non-empty array')
    }

    const order = await OrderModel.findById(orderId).populate('userId', '_id name email phoneNumber').lean()

    if (!order) throw new Error('Order not found')

    const productTracking = await OrderItemTrackingModal.findById(productTrackingId).lean()

    if (!productTracking) throw new Error('productTrackingId not found')

    const summary: ItemResult[] = []

    // Process items sequentially
    for (const incomingItem of items) {
      const { orderItemId, productId, cancelQuantity } = incomingItem
      const itemResult: ItemResult = {
        orderItemId,
        productId,
        cancelQuantity,
        status: 'error'
      }

      try {
        // Validate itemId & productId
        if (!orderItemId) {
          itemResult.message = 'Invalid or missing orderItemId'
          summary.push(itemResult)
          continue
        }
        if (!productId) {
          itemResult.message = 'Invalid or missing productId'
          summary.push(itemResult)
          continue
        }
        if (
          typeof cancelQuantity !== 'number' ||
          !Number.isFinite(cancelQuantity) ||
          cancelQuantity <= 0 ||
          !Number.isInteger(cancelQuantity)
        ) {
          itemResult.message = 'cancelQuantity must be a positive integer'
          summary.push(itemResult)
          continue
        }

        // Fetch order item and populate product if possible
        // If your OrderItem stores product reference in `product` field, populate it
        const orderItem = await OrderItemModel.findById(orderItemId).lean()
        if (!orderItem) {
          itemResult.message = 'Order item not found'
          summary.push(itemResult)
          continue
        }

        // Determine ordered qty for this line
        const orderedQty =
          typeof orderItem.quantity === 'number' ? orderItem.quantity : Number(orderItem.quantity || 0)
        if (!Number.isFinite(orderedQty) || orderedQty <= 0) {
          itemResult.message = 'Order item has invalid ordered quantity'
          summary.push(itemResult)
          continue
        }

        // Compare to determine full vs partial cancel
        if (cancelQuantity > orderedQty) {
          itemResult.message = `cancelQuantity (${cancelQuantity}) exceeds ordered quantity (${orderedQty})`
          summary.push(itemResult)
          continue
        }

        // Decide full or partial
        const isFullCancel = cancelQuantity === orderedQty

        // Call the appropriate function — these should be your real implementations
        if (isFullCancel) {
          // FULL cancel
          const res = await this.cancelItem({
            order,
            orderItem,
            productTracking,
            reason: reasonCode,
            note: notes,
            adminUser: params?.user
          })
          itemResult.status = 'ok'
          itemResult.message = 'Full cancel processed'
          itemResult.details = res
        } else {
          // PARTIAL cancel
          const res = await this.partialCancel({
            order,
            orderItem,
            productTracking,
            cancelQuantity,
            reason: reasonCode,
            note: notes,
            user: order?.userId,
            adminUser: params?.user
          })
          itemResult.status = 'ok'
          itemResult.message = 'Partial cancel processed'
          itemResult.details = res
        }
      } catch (err: any) {
        // Per-item error capture — continue processing next items
        itemResult.status = 'error'
        itemResult.message = err?.message || String(err)
      }

      summary.push(itemResult)
    }

    // Track order cancellation event in CleverTap
    try {
      const userId = order?.userId as any
      await trackOrderCancelled({
        userId: userId?._id?.toString() || '',
        orderId: order?.orderId || '',
        dateOfOrder: order?.createdAt || new Date().toISOString(),
        customerName: userId?.name || '',
        email: userId?.email || '',
        cancellationReason: reasonCode || 'Admin cancellation'
      })
    } catch (error) {
      console.error('Failed to track order cancellation event:', error)
    }

    // Optionally: update order totals/status depending on results
    // await this.recalculateOrder(orderId)

    return { summary, orderId }
  }

  private async cancelItem(data: {
    order: any
    orderItem: any
    productTracking: any
    reason?: string
    note?: string
    adminUser: any
  }) {
    console.log('Applying cancelItem =====>')
    const { order, orderItem, productTracking, reason, note, adminUser } = data
    await cancelOrderItem({
      order,
      orderItem,
      productTracking,
      reason: reason ?? '',
      note,
      adminUser: adminUser,
      isCancelledByAdmin: true
    })

    // write tracking record if required
    return { ok: true, action: 'full-cancel' }
  }

  private async partialCancel(data: {
    order: any
    orderItem: any
    productTracking: any
    cancelQuantity: number
    reason?: string
    note?: string
    user: any
    adminUser: any
  }) {
    const { order, orderItem, productTracking, reason, note, cancelQuantity, user, adminUser } = data

    await partialCancelOrderItem({
      order,
      orderItem,
      productTracking,
      reason: reason ?? '',
      note,
      cancelQuantity,
      isCancelledByAdmin: true,
      user,
      adminUser
    })

    return { ok: true, action: 'partial-cancel' }
  }
}

export class OrderSkipLogisticsService<ServiceParams extends Params = SuperAdminOrdersParams>
  implements
    ServiceInterface<SuperAdminOrders, SuperAdminOrdersData, SuperAdminOrdersParams, SuperAdminOrdersPatch>
{
  constructor(public options: any) {}

  async update(_id: NullableId, data: any, params?: any): Promise<any> {
    const { skipLogistics = true, orderTrackingId } = data

    // Update the order's skipLogistics field
    const order = await OrderModel.findByIdAndUpdate(_id, { skipLogistics }).lean()

    if (!order) throw new BadRequest('Order not found')

    // If orderTrackingId is provided, add the appropriate status to the specific tracking
    if (orderTrackingId) {
      // Find the specific order item tracking
      const tracking = await OrderItemTrackingModal.findOne({
        _id: orderTrackingId,
        order: _id,
        isDeleted: { $ne: true }
      }).lean()

      if (tracking) {
        const timeline = tracking.timeline || []
        let statusToAdd = null

        if (skipLogistics) {
          // Get the skip_logistic status data
          const skipLogisticStatus = await AppDataModel.findOne({
            type: CONSTANTS.TYPE.TRACKING_STATUS,
            statusCode: 'skip_logistic'
          }).lean()

          if (skipLogisticStatus) {
            // Check if skip_logistic status already exists in timeline
            const hasSkipLogisticStatus = timeline.some((item: any) => item.statusCode === 'skip_logistic')

            if (!hasSkipLogisticStatus) {
              statusToAdd = skipLogisticStatus
            } else {
              // Status already exists, but we still need to update lastTimelineStatus
              statusToAdd = skipLogisticStatus
            }
          }
        } else {
          // Get the unskip_logistic status data
          const unskipLogisticStatus = await AppDataModel.findOne({
            type: CONSTANTS.TYPE.TRACKING_STATUS,
            statusCode: 'unskip_logistic'
          }).lean()

          if (unskipLogisticStatus) {
            // Check if unskip_logistic status already exists in timeline
            const hasUnskipLogisticStatus = timeline.some(
              (item: any) => item.statusCode === 'unskip_logistic'
            )

            if (!hasUnskipLogisticStatus) {
              statusToAdd = unskipLogisticStatus
            } else {
              // Status already exists, but we still need to update lastTimelineStatus
              statusToAdd = unskipLogisticStatus
            }
          }
        }

        // Add the status to timeline if not already present, but always update lastTimelineStatus
        if (statusToAdd) {
          const statusAlreadyExists = timeline.some((item: any) => item.statusCode === statusToAdd.statusCode)

          if (!statusAlreadyExists) {
            timeline.push({
              label: statusToAdd.name,
              date: new Date(),
              statusCode: statusToAdd.statusCode,
              authorName: params?.user?.name || 'Super Admin (System)',
              authorType: params?.user?.userType || 'super-admin'
            })
          }

          // Always update lastTimelineStatus, even if status already exists in timeline
          await OrderItemTrackingModal.findByIdAndUpdate(tracking._id, {
            ...(statusAlreadyExists ? {} : { timeline }),
            lastTimelineStatus: statusToAdd.statusCode
          })
        }
      }
    }

    return order
  }
}

export class ModifyReturnService<ServiceParams extends Params = SuperAdminOrdersParams>
  implements
    ServiceInterface<SuperAdminOrders, SuperAdminOrdersData, SuperAdminOrdersParams, SuperAdminOrdersPatch>
{
  constructor(public options: any) {}

  async create(data: any, params: any): Promise<any> {
    try {
      const { orderItemTrackingId, orderItemId, returnQuantity } = data

      const orderItemTracking = await OrderItemTrackingModal.findById(orderItemTrackingId).lean()

      if (!orderItemTracking) return {}

      const parentOrderItemTracking = await OrderItemTrackingModal.findById(
        orderItemTracking?.parentOrderTracking
      ).lean()

      const orderItem = await OrderItemModel.findById(orderItemId).lean()

      let parentOrderItem = orderItem

      if (orderItem?.parentOrderItemId)
        parentOrderItem = await OrderItemModel.findById(orderItem?.parentOrderItemId).lean()

      if (!parentOrderItem) return {}

      const originalQuantity = parentOrderItem?.quantity ?? 0
      const qtyReturnToOrderTracking = originalQuantity - Number(returnQuantity)

      // Process for return back some qty to order tracking
      const ODiscountAmount = getPartialItemDiscount(parentOrderItem as any, qtyReturnToOrderTracking)
      const RDiscountAmount = getPartialItemDiscount(parentOrderItem as any, Number(returnQuantity))

      // handle dava coins if applied
      let remainingAllocatedCoins = 0,
        refundedCoins = 0

      if (parentOrderItem?.davaCoinsUsed && parentOrderItem?.davaCoinsUsed > 0) {
        const davaCoinsDetails = processProductPartialCancellationWithDavaCoins({
          productId: parentOrderItem.product.toString(),
          totalQty: parentOrderItem?.quantity,
          allocatedCoins: parentOrderItem?.davaCoinsUsed,
          cancelQty: returnQuantity
        })

        remainingAllocatedCoins = davaCoinsDetails?.remainingAllocatedCoins
        refundedCoins = davaCoinsDetails?.refundedCoins
      }

      // Todo: update order item
      // 0. Create a partial return orderItem

      if (orderItem?.isPartialReturnRequested) {
        await OrderItemModel.updateOne(
          { _id: orderItem?._id },
          {
            davaCoinsUsed: refundedCoins,
            isReturnRequested: true,
            isPartialReturnRequested: true,
            isReturnQtyModified: true,
            quantity: returnQuantity,
            discountAmount: RDiscountAmount
          }
        )
      } else {
        const returnOrderItemPayload = {
          orderTracking: orderItemTracking?._id,
          order: orderItemTracking?.order,
          product: parentOrderItem?.product,
          user: parentOrderItem.user,
          parentOrderItemId: parentOrderItem._id,
          isReturnRequested: true,
          isPartialReturnRequested: true,
          isReturnQtyModified: true,
          quantity: returnQuantity,
          // store unitPrice explicitly if you want later computations to be deterministic
          amount: parentOrderItem.amount,
          discountAmount: RDiscountAmount,
          davaCoinsUsed: refundedCoins,
          gstDetails: null,
          suggestedStoreId: parentOrderItem?.suggestedStoreId,
          suggestedBatchNo: parentOrderItem?.batchNo,
          isPrescriptionRequired: parentOrderItem.isPrescriptionRequired,
          returnDetails: orderItem?.returnDetails,
          partialReturnRequestStatus: 'approved'
        }

        const createdReturnItems = await OrderItemModel.create([returnOrderItemPayload])
        const returnOrderItem = createdReturnItems[0].toObject()

        await OrderItemTrackingModal.updateOne(
          { _id: orderItemTracking?._id },
          { type: ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.PARTIAL_RETURN }
        )

        // 1. change orderTrackingID to parent
        await OrderItemModel.updateOne(
          { _id: parentOrderItem._id },
          {
            orderTracking: parentOrderItemTracking?._id,
            // quantity: qtyReturnToOrderTracking,
            isReturnRequested: false,
            returnDetails: null,
            discountAmount: ODiscountAmount,
            davaCoinsUsed: remainingAllocatedCoins
          }
        )

        // update orderItemTracking with created returnOrderItem
        await OrderItemTrackingModal.updateOne(
          { _id: orderItemTracking._id },
          { items: [returnOrderItem._id] }
        )
      }

      return { message: 'Return Tracking updated successfully!' }
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('orders'))
  }
}
