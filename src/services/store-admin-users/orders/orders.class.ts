// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, Params } from '@feathersjs/feathers'

import type { Application } from '../../../declarations'
import type {
  StoreAdminUsersOrders,
  StoreAdminUsersOrdersData,
  StoreAdminUsersOrdersPatch,
  StoreAdminUsersOrdersQuery
} from './orders.schema'
import mongoose, { Types } from 'mongoose'
import {
  OrderItemTrackingModal,
  CONSTANTS as ORDER_ITEM_TRACKING_CONSTANTS
} from '../../order-item-tracking/order-item-tracking.schema'
import { OrderModel } from '../../order/order.schema'
import { BadRequest } from '@feathersjs/errors'
import { excludeFieldsInObject } from '../../../utils'
import { StoreInventoryModel } from '../../store-inventory/store-inventory.schema'
import { OrderItemModel } from '../../order-items/order-items.schema'
import { manageProductQuantityFromOrderTrackingId, releaseOrderSoftHold } from '../../../utils/inventory'
import { PACKAGE_SPCECS } from '../../../constants/general'
import { app } from '../../../app'
import { RefundModal } from '../../refund/refund.schema'
import { UsersModel } from '../../users/users.schema'

export type {
  StoreAdminUsersOrders,
  StoreAdminUsersOrdersData,
  StoreAdminUsersOrdersPatch,
  StoreAdminUsersOrdersQuery
}

export interface StoreAdminUsersOrdersServiceOptions {
  app: Application
}

export interface StoreAdminUsersOrdersParams extends Params<StoreAdminUsersOrdersQuery> {}

// Helper functions for cleaner search logic
const isUserFieldCondition = (condition: any): boolean => {
  return 'userId.email' in condition || 'userId.phoneNumber' in condition
}

const extractRegexSearchTerm = (condition: any): string | null => {
  if (condition['userId.email']?.$regex) return condition['userId.email'].$regex
  if (condition['userId.phoneNumber']?.$regex) return condition['userId.phoneNumber'].$regex
  if (condition['orderId']?.$regex) return condition['orderId'].$regex
  return null
}

const separateSearchConditions = (orConditions: any[]) => {
  const orderIdSearches: any[] = []
  const userFieldSearches: any[] = []

  for (const condition of orConditions) {
    if (isUserFieldCondition(condition)) {
      userFieldSearches.push(condition)
    } else {
      orderIdSearches.push(condition)
    }
  }

  return { orderIdSearches, userFieldSearches }
}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class StoreAdminUsersOrdersService {
  constructor(public options: StoreAdminUsersOrdersServiceOptions) {}

  async find(params?: any): Promise<any> {
    try {
      const query = params?.query || {}

      // Normalize timelineStatus to always be an array
      if (query.timelineStatus && !Array.isArray(query.timelineStatus)) {
        query.timelineStatus = [query.timelineStatus]
      }

      // Normalize paymentMethod to always be an array
      if (query.paymentMethod && !Array.isArray(query.paymentMethod)) {
        query.paymentMethod = [query.paymentMethod]
      }

      // Normalize deliveryMode to always be an array
      if (query.deliveryMode && !Array.isArray(query.deliveryMode)) {
        query.deliveryMode = [query.deliveryMode]
      }

      const baseQuery = excludeFieldsInObject(['$limit', '$skip', '$sort', 'userId', 'excludeOrderId'], query)

      const user = params?.user
      const store = user?.storeIds?.[0]

      // Step 1: Fetch tracking items by store in bulk
      const orderTrackingItems = await OrderItemTrackingModal.find({ store, isDeleted: { $ne: true } }).lean()
      const orderIds = [...new Set(orderTrackingItems.map((item) => item.order.toString()))]

      // ============ TWO-LAYER SEARCH STRATEGY ============
      // Layer 1: Search by orderId (fast, direct match)
      // Layer 2: Search by user fields (requires pre-filtering users collection)

      let orderIdFilters: any[] = []
      let userIdFilters: any = null
      let statusFilters: any[] = []

      // Process $or conditions (search queries)
      if (baseQuery.$or) {
        const { orderIdSearches, userFieldSearches } = separateSearchConditions(baseQuery.$or)

        // Layer 1: OrderId search
        if (orderIdSearches.length > 0) {
          orderIdFilters.push(...orderIdSearches)
        }

        // Layer 2: User field search
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

            const userIds = matchingUsers.map((u: any) => new mongoose.Types.ObjectId(u._id))

            // Early return if no users match and no orderId search
            if (userIds.length === 0 && orderIdFilters.length === 0) {
              return { total: 0, data: [] }
            }

            if (userIds.length > 0) {
              userIdFilters = { userId: { $in: userIds } }
            }
          }
        }
      }

      // Process $and conditions (search + status filters)
      if (baseQuery.$and) {
        for (const andCondition of baseQuery.$and) {
          if (andCondition.$or) {
            const { orderIdSearches, userFieldSearches } = separateSearchConditions(andCondition.$or)

            if (orderIdSearches.length > 0 && orderIdSearches[0].status) {
              statusFilters.push(...orderIdSearches)
            } else if (orderIdSearches.length > 0) {
              orderIdFilters.push(...orderIdSearches)
            }
          }
        }
      }

      // Build clean match conditions
      const matchConditions: any = {
        _id: { $in: orderIds.map((id) => new mongoose.Types.ObjectId(id)) }
      }

      // Add other direct filters
      for (const [key, value] of Object.entries(baseQuery)) {
        if (key !== '$or' && key !== '$and') {
          matchConditions[key] = value
        }
      }

      // Combine search conditions intelligently
      // Search conditions (orderId + user fields) should be combined with $or
      // Status filters should be combined with $and

      const searchConditions: any[] = []

      // Combine orderId and user searches with $or (user searching for orderId OR email OR phone)
      if (orderIdFilters.length > 0 && userIdFilters) {
        // Both orderId search and user field search present
        searchConditions.push(...orderIdFilters)
        searchConditions.push(userIdFilters)
        matchConditions.$or = searchConditions
      } else if (orderIdFilters.length > 0) {
        // Only orderId search
        if (orderIdFilters.length === 1) {
          Object.assign(matchConditions, orderIdFilters[0])
        } else {
          matchConditions.$or = orderIdFilters
        }
      } else if (userIdFilters) {
        // Only user field search
        Object.assign(matchConditions, userIdFilters)
      }

      // Status filters are combined with $and (must match status AND search)
      if (statusFilters.length > 0) {
        if (matchConditions.$or) {
          // If we have search conditions, combine with status using $and
          matchConditions.$and = [{ $or: matchConditions.$or }, { $or: statusFilters }]
          delete matchConditions.$or
        } else {
          // No search conditions, just apply status filter
          if (statusFilters.length === 1) {
            Object.assign(matchConditions, statusFilters[0])
          } else {
            matchConditions.$or = statusFilters
          }
        }
      }

      // Add userId filter if provided
      if (query.userId) {
        try {
          matchConditions.userId = new mongoose.Types.ObjectId(query.userId)
        } catch (error) {
          console.error('Invalid userId format:', error)
        }
      }

      // Handle excludeOrderId filter
      if (query.excludeOrderId) {
        try {
          const excludeId = new mongoose.Types.ObjectId(query.excludeOrderId)
          matchConditions._id = {
            $in: orderIds.map((id) => new mongoose.Types.ObjectId(id)),
            $ne: excludeId
          }
        } catch (error) {
          console.error('Invalid excludeOrderId format:', error)
        }
      }

      // Detect if we have search/filters that require user lookup for filtering
      const hasSearchOrFilters =
        orderIdFilters.length > 0 || userIdFilters !== null || statusFilters.length > 0

      // Step 2: Build OPTIMIZED aggregation pipeline
      let aggregationPipeline: any[] = []

      if (!hasSearchOrFilters) {
        // ⚡ FAST PATH: No search/filters - Paginate BEFORE expensive lookup
        aggregationPipeline = [
          { $match: matchConditions },
          { $sort: query?.$sort || { _id: -1 } },
          { $skip: query?.$skip || 0 },
          ...(query?.$limit ? [{ $limit: query.$limit }] : [{ $limit: 10 }]),
          // User lookup ONLY on paginated results (10 records instead of 10,000!)
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'userId'
            }
          },
          { $unwind: '$userId' }
        ]
      } else {
        // 🔍 SEARCH/FILTER PATH: Need user data for filtering
        aggregationPipeline = [
          { $match: matchConditions },
          // User lookup needed for search/filter
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'userId'
            }
          },
          { $unwind: '$userId' },
          { $sort: query?.$sort || { _id: -1 } },
          {
            $facet: {
              data: [{ $skip: query?.$skip || 0 }, ...(query?.$limit ? [{ $limit: query.$limit }] : [])],
              totalCount: [{ $count: 'count' }]
            }
          }
        ]
      }

      let data: any[]
      let total: number

      if (!hasSearchOrFilters) {
        // Fast path: Data is already in array format, need separate count query
        data = await OrderModel.aggregate(aggregationPipeline).allowDiskUse(true).exec()

        // Get total count separately (fast, no lookup needed)
        const [countResult] = await OrderModel.aggregate([
          { $match: matchConditions },
          { $count: 'count' }
        ]).exec()
        total = countResult?.count || 0
      } else {
        // Search/filter path: Data is in facet format
        const [aggregationResult] = await OrderModel.aggregate(aggregationPipeline).allowDiskUse(true).exec()
        data = aggregationResult.data || []
        total = aggregationResult.totalCount[0]?.count || 0
      }

      // Step 3: Get order tracking data for matched orders (filtered by current store only)
      const trackingData = await OrderItemTrackingModal.find({
        order: { $in: data.map((d: any) => d._id) },
        store: store,
        isDeleted: { $ne: true }
      }).lean()

      const trackingMap = new Map()

      for (const doc of trackingData) {
        const key = doc.order.toString()
        if (!trackingMap.has(key)) {
          trackingMap.set(key, [doc])
        } else {
          trackingMap.get(key).push(doc)
        }
      }

      // Step 4: Enrich orders
      const enrichedOrders = data.map((order: any) => {
        const trackings = trackingMap.get(order._id.toString())
        const statusLabels = trackings?.map((t: any) => t?.timeline?.at(-1)?.label).filter(Boolean)
        const lastTimelineStatus = statusLabels?.join(' & ') || null
        return {
          ...order,
          user: {
            ...order.user
            // Optionally mask data:
            // email: maskEmail(order.user.email),
            // phoneNumber: maskString(order.user.phoneNumber)
          },
          lastTimelineStatus
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

  async get(id: Id, params?: any): Promise<any> {
    const user = params?.user
    const requestStoreId = user?.storeIds?.[0]

    // fetch order
    const order: any = await OrderModel.findById(id)
      .populate('userId', 'name email') // fetch only needed fields
      .lean()
    if (!order) throw new BadRequest('Not found')

    // fetch order trackings
    const orderTrackings: any[] = await OrderItemTrackingModal.find({
      order: order._id,
      store: requestStoreId,
      isDeleted: { $ne: true }
    })
      .populate('store', 'name location')
      .populate({
        path: 'items',
        populate: { path: 'product', populate: { path: 'taxes', select: 'name rate' } }
      })
      .lean()

    if (!orderTrackings.length) throw new BadRequest('Not found')

    // Separate trackings by type
    const orderTypeTrackings: any[] = []
    const cancelOrReturnTrackings: any[] = []

    const cancelReturnTypes = new Set([
      ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.RETURN,
      ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.CANCEL,
      ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.PARTIAL_CANCEL,
      ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.PARTIAL_RETURN
    ])

    for (const t of orderTrackings) {
      if (t.type === ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.ORDER) orderTypeTrackings.push(t)
      else if (cancelReturnTypes.has(t.type)) cancelOrReturnTrackings.push(t)
    }

    if (!orderTypeTrackings.length) throw new BadRequest('Not found')

    // Generate invoices in parallel
    await Promise.allSettled(
      orderTypeTrackings.map(async (tracking) => {
        const dispatched = (tracking.timeline ?? []).some((x: any) => x.statusCode === 'dispatched')
        if (dispatched && !tracking.invoiceUrl) {
          try {
            const { invoiceUrl } = await app.service('downloads/invoice').get(tracking._id.toString(), params)
            tracking.invoiceUrl = invoiceUrl
          } catch (err) {
            console.log('Error generating invoice', tracking._id.toString(), err)
          }
        }
      })
    )

    // Build inventory map for quick lookup
    const inventoryFilter: any[] = []
    orderTypeTrackings.forEach((tracking) => {
      tracking.items?.forEach((item: any) =>
        inventoryFilter.push({ storeId: tracking.store._id, productId: item.product._id })
      )
    })

    const inventory: any[] =
      inventoryFilter.length > 0 ? await StoreInventoryModel.find({ $or: inventoryFilter }).lean() : []

    const inventoryMap = new Map<string, any>()
    inventory.forEach((inv) => inventoryMap.set(`${inv.storeId.toString()}_${inv.productId.toString()}`, inv))

    // Create map for cancel/return tracking for O(1) lookup
    const itemTrackingMap = new Map<string, any>()
    for (const t of cancelOrReturnTrackings) {
      for (const item of t.items ?? []) {
        itemTrackingMap.set(item._id.toString(), t)
      }
    }

    // Process order trackings
    orderTypeTrackings.forEach((tracking) => {
      const packageSpecs = tracking.packageSize === 'big' ? PACKAGE_SPCECS.BIG : PACKAGE_SPCECS.SMALL
      const { type, length, width, breadth, weight } = packageSpecs
      tracking.packageSpecs = `${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()} (${
        weight
      } kg, Dimension: ${breadth}x${length}x${width})`

      // last logistics status
      const lastTrackingStatus = [...(tracking.timeline ?? [])].reverse().find((t) => t.type === 'logistics')
      if (lastTrackingStatus) tracking.trackingStatus = lastTrackingStatus.label

      tracking.items?.forEach((item: any) => {
        item.product = { ...(item.product ?? {}) }

        // attach inventory batches
        const invKey = `${tracking.store._id.toString()}_${item.product._id.toString()}`
        const inventoryData = inventoryMap.get(invKey)
        const today = new Date()
        item.product.batches = (inventoryData?.batches ?? [])
          .filter((batch: any) => {
            const expiryDate = new Date(batch.expiryDate)
            const daysDifference = (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            return batch.stock >= item.quantity && daysDifference > 90
          })
          .map((b: any) => ({ batchNo: b.batchNo, expiryDate: b.expiryDate }))

        // attach cancel/return tracking
        const crTracking = itemTrackingMap.get(item._id.toString())
        if (crTracking) {
          if (crTracking.type === ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.CANCEL)
            item.cancelTracking = JSON.parse(JSON.stringify(crTracking))
          else item.returnTracking = JSON.parse(JSON.stringify(crTracking))
          const tl = crTracking.timeline ?? []
          if (tl.length) item.lastActivity = tl[tl.length - 1].statusCode
        }
      })
    })

    order.orderItemTracking = orderTypeTrackings
    order.cancelAndReturnTrackings = cancelOrReturnTrackings

    // total refunds
    const refunds = await RefundModal.find({ order: order._id }).select('_id amount paymentId').lean()
    order.totalRefundAmount = refunds.reduce((acc, r) => acc + r.amount / 100, 0)
    order.refundTransactionIds = refunds.map((r) => r.paymentId)

    return order
  }

  async create() {}

  // This method has to be added to the 'methods' option to make it available to clients
  async update() {}

  async patch(id: any, data: any, params?: any): Promise<any> {
    try {
      const order: any = await OrderModel.findById(id).lean()

      if (!order) throw new Error('Order not found!')

      const orderItemsTracking = await OrderItemTrackingModal.findOne({
        order: order?._id,
        isDeleted: { $ne: true }
      }).lean()

      if (!orderItemsTracking) throw new Error('Order tracking is not found')

      const res = await OrderModel.findByIdAndUpdate(id, { ...data })

      await OrderItemTrackingModal.findOneAndUpdate(
        { order: order?._id, isDeleted: { $ne: true } },
        { ...data }
      )

      return res
    } catch (error) {
      throw new Error('Error while updating the order')
    }
  }

  async remove() {}
}

export class StoreAdminAddProductBatchNoService {
  constructor(public options: any) {}
  async find(params: any): Promise<any> {}
  async get(id: any, params: any): Promise<any> {}
  async create(data: any, params: any): Promise<any> {}
  async patch(id: any, data: any, params?: any): Promise<any> {
    const { orderId } = params.route
    const { storeId, productBatches = [] } = data

    // const storeIds = params.user.storeIds
    // if (!storeIds.map((s: any) => s.toString()).includes(storeId))
    //   throw new BadRequest('You do not have access to this store')

    const orderTracking = await OrderItemTrackingModal.findOne({
      store: new Types.ObjectId(storeId),
      order: new Types.ObjectId(orderId),
      isDeleted: { $ne: true }
    }).lean()
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

export const getOptions = (app: Application) => {
  return { app }
}
