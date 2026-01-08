// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params } from '@feathersjs/feathers'

import type { Application } from '../../../declarations'
import type {
  SuperAdminUsersChangeStore,
  SuperAdminUsersChangeStoreData,
  SuperAdminUsersChangeStorePatch,
  SuperAdminUsersChangeStoreQuery
} from './change-store.schema'
import { DeliveryPoliciesModel } from '../../delivery-policies/delivery-policies.schema'
import { StoreModel } from '../../stores/stores.schema'
import { BadRequest } from '@feathersjs/errors'
import { OrderItemTrackingModal } from '../../order-item-tracking/order-item-tracking.schema'
import { OrderModel } from '../../order/order.schema'
import { Types } from 'mongoose'
import { releaseOrderSoftHold, softHoldForOrder, checkStoreHasEnoughQuantity } from '../../../utils/inventory'
import { handleStoreChanges } from './change-store.shared'
import { OrderItemModel } from '../../order-items/order-items.schema'
import { AppDataModel, CONSTANTS } from '../../app-data/app-data.schema'
import { StoreAdminUserModal } from '../../store-admin-users/store-admin-users.schema'
import { notificationServices } from '../../../socket/namespaceManager'
import moment from 'moment'

export type {
  SuperAdminUsersChangeStore,
  SuperAdminUsersChangeStoreData,
  SuperAdminUsersChangeStorePatch,
  SuperAdminUsersChangeStoreQuery
}

export interface SuperAdminUsersChangeStoreServiceOptions {
  app: Application
}

export interface SuperAdminUsersChangeStoreParams extends Params<SuperAdminUsersChangeStoreQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class SuperAdminUsersChangeStoreService {
  constructor(public options: SuperAdminUsersChangeStoreServiceOptions) {}

  async find(params?: any): Promise<any[]> {
    const storeId = params?.query?.storeId
    const orderId = params?.query?.orderId

    const orderTracking: any = await OrderItemTrackingModal.findOne({
      order: new Types.ObjectId(orderId),
      store: new Types.ObjectId(storeId),
      isDeleted: { $ne: true }
    })
      .populate('items')
      .lean()

    const deliveryPolicy = await DeliveryPoliciesModel.findOne({ stores: new Types.ObjectId(storeId) }).lean()
    const stores: any = await StoreModel.find({
      _id: {
        $in: deliveryPolicy?.stores?.filter((item) => item?.toString() != storeId)
      },
      $or: [
        { deleted: { $exists: false } }, // Check if 'deleted' does not exist
        { deleted: false } // Check if 'deleted' is false
      ],
      active: true
    }).lean()

    return stores
  }

  async get(id: Id, _params?: any): Promise<any> {}

  async create(data: any, params?: any): Promise<any> {
    try {
      const { transferredStoreId, orderId } = data
      const store = await StoreModel.findById(transferredStoreId).lean()
      if (!store) throw new BadRequest('Store not found')

      const order = await OrderModel.findById(orderId).lean()
      if (!order) throw new BadRequest('Order not found')

      return await handleStoreChanges({ order, store, data, params })
    } catch (error) {
      throw error
    }
  }

  // This method has to be added to the 'methods' option to make it available to clients
  async update(id: NullableId, data: SuperAdminUsersChangeStoreData, _params?: any): Promise<any> {}

  async patch(id: NullableId, data: SuperAdminUsersChangeStorePatch, _params?: any): Promise<any> {
    return {
      id: 0,
      text: `Fallback for ${id}`,
      ...data
    }
  }

  async remove(id: NullableId, _params?: any): Promise<any> {
    return {
      id: 0,
      text: 'removed'
    }
  }
}
export class SuperAdminPartialOrderTransferService {
  constructor(public options: SuperAdminUsersChangeStoreServiceOptions) {}

  async find(params?: any): Promise<any[]> {
    return []
  }

  async get(id: Id, _params?: any): Promise<any> {
    return {}
  }

  async create(data: any, params?: any): Promise<any> {
    try {
      const { transferredStoreId, orderId, currentStoreId, selectedProducts, cancelReason, comment } = data
      const user = params?.user ?? {}

      // 1) Basic validations
      const { store, order } = await this.validateAndLoadStoreOrder(
        transferredStoreId,
        orderId,
        selectedProducts
      )

      const [fromStore, toStore] = await Promise.all([
        StoreModel.findById(currentStoreId, '_id name storeCode').lean(),
        StoreModel.findById(transferredStoreId, '_id name storeCode').lean()
      ])

      // 2) Build a sanitized map of productId -> transferQty (positive only)
      const rawMap = this.buildSanitizedTransferMap(selectedProducts)

      // 3) Fetch the specific store's tracking and items (not just any tracking for the order)
      const originalOrderTracking = await this.getOriginalTracking(orderId, currentStoreId)

      // Dispatched check
      this.ensureNotDispatched(originalOrderTracking, currentStoreId)

      // 4) Filter map to products that exist in this tracking
      const transferMap = this.filterMapToTrackingItems(rawMap, originalOrderTracking.items)

      if (transferMap.size === 0) {
        throw new BadRequest('No positive transfer quantities found for items in this order')
      }

      // 5) Release soft hold on original tracking before modifications
      await releaseOrderSoftHold({ orderTrackingId: originalOrderTracking._id })

      // 6) Validate availability at target store (for positive transfer quantities only)
      const productsToCheck = this.mapToProductsArray(transferMap)
      const { available, inventoryItems } = await checkStoreHasEnoughQuantity(
        transferredStoreId,
        productsToCheck
      )

      if (!available) {
        const unavailableProducts = productsToCheck.filter((product) => {
          const inv = inventoryItems.find((it: any) => it.productId.toString() === product.productId)
          const freeStock = (inv?.stock ?? 0) - (inv?.softHoldCount ?? 0) - (inv?.softHoldForOrderCount ?? 0)
          return !inv || freeStock < product.quantity
        })
        const ids = unavailableProducts.map((p) => p.productId).join(', ')
        throw new BadRequest(`Insufficient stock in target store for products: ${ids}`)
      }

      // 7) Prepare activity metadata
      const { storeChangeActivity, transferredActivity } = await this.buildTransferredActivity(
        user,
        originalOrderTracking,
        cancelReason,
        comment,
        fromStore,
        toStore
      )

      // 8) Split: create new items (transferred & balance clones)
      const { transferredOrderItemIds, balanceOrderItemIds, transferredUnitsSum } =
        await this.splitAndCloneItems(originalOrderTracking.items, transferMap)

      if (transferredOrderItemIds.length === 0) {
        // All requested were zero (or clamped to zero by originalQty)
        throw new BadRequest('No positive transfer quantities found')
      }

      // 9) Create TWO brand-new trackings
      const balanceActivity = {
        ...transferredActivity,
        comment: `Partial transfer out: ${transferredUnitsSum} unit(s) moved to ${store.storeName}. Balance retained.`
      }

      const { transferredTracking, balanceTracking } = await this.createNewTrackings({
        originalOrderTracking,
        transferredOrderItemIds,
        balanceOrderItemIds,
        transferredStoreId,
        orderId,
        transferredActivity,
        balanceActivity,
        storeChangeActivity
      })

      // 10) Point new items to their trackings
      await this.pointItemsToTrackings(transferredOrderItemIds, transferredTracking?._id)
      if (balanceOrderItemIds.length > 0 && balanceTracking?._id) {
        await this.pointItemsToTrackings(balanceOrderItemIds, balanceTracking._id)
      }

      // 11) Soft-delete the parent/original tracking
      await OrderItemTrackingModal.findByIdAndUpdate(originalOrderTracking._id, {
        $set: { isDeleted: true }
      })

      // 12) Apply soft holds to the new trackings
      await softHoldForOrder({ orderTrackingId: transferredTracking._id })
      if (balanceTracking?._id) {
        await softHoldForOrder({ orderTrackingId: balanceTracking._id })
      }

      // 13) Notify target store users
      await this.notifyTargetStoreUsers(store, {
        orderId,
        transferredUnitsSum,
        transferredLinesCount: transferredOrderItemIds.length
      })

      // 14) Done
      return {
        message: 'Partial order transfer completed successfully',
        transferredLinesCount: transferredOrderItemIds.length,
        transferredUnits: transferredUnitsSum,
        balanceLinesCount: balanceOrderItemIds.length,
        transferredOrderTrackingId: transferredTracking._id,
        balanceOrderTrackingId: balanceTracking?._id ?? null,
        originalOrderTrackingId: originalOrderTracking._id,
        originalOrderTrackingDeleted: true
      }
    } catch (error) {
      console.error('Partial order transfer error:', error)
      throw error
    }
  }

  async update(id: NullableId, data: any, _params?: any): Promise<any> {
    return {}
  }

  async patch(id: NullableId, data: any, _params?: any): Promise<any> {
    return {}
  }

  async remove(id: NullableId, _params?: any): Promise<any> {
    return {}
  }

  // -----------------------
  // Private helper methods
  // -----------------------

  private async validateAndLoadStoreOrder(transferredStoreId: any, orderId: any, selectedProducts: any[]) {
    const store = await StoreModel.findById(transferredStoreId).lean()
    if (!store) throw new BadRequest('Target store not found')

    const order = await OrderModel.findById(orderId).lean()
    if (!order) throw new BadRequest('Order not found')

    if (!selectedProducts || !Array.isArray(selectedProducts) || selectedProducts.length === 0) {
      throw new BadRequest('No products selected for transfer')
    }

    return { store, order }
  }

  private buildSanitizedTransferMap(selectedProducts: any[]): Map<string, number> {
    const rawMap = new Map<string, number>()
    for (const sp of selectedProducts) {
      const pid = (sp?.product?._id ?? sp?.product)?.toString()
      const qty = Math.max(0, Number(sp?.transferQuantity) || 0)
      if (pid && qty > 0) rawMap.set(pid, qty)
    }
    return rawMap
  }

  private async getOriginalTracking(orderId: any, currentStoreId: any) {
    const originalOrderTracking: any = await OrderItemTrackingModal.findOne({
      order: new Types.ObjectId(orderId),
      store: new Types.ObjectId(currentStoreId),
      isDeleted: { $ne: true }
    })
      .populate('items')
      .lean()

    if (!originalOrderTracking) {
      throw new BadRequest(`Order tracking not found for store: ${currentStoreId}`)
    }

    return originalOrderTracking
  }

  private ensureNotDispatched(originalOrderTracking: any, currentStoreId: any) {
    if (originalOrderTracking.timeline?.find((t: any) => t.statusCode === 'dispatched')) {
      throw new BadRequest('Dispatched order can not be transferred')
    }
  }

  private filterMapToTrackingItems(rawMap: Map<string, number>, trackingItems: any[]): Map<string, number> {
    const originalProductIds = new Set((trackingItems ?? []).map((it: any) => it.product?.toString?.()))
    const transferMap = new Map<string, number>()
    for (const [pid, qty] of rawMap.entries()) {
      if (originalProductIds.has(pid)) transferMap.set(pid, qty)
    }
    return transferMap
  }

  private mapToProductsArray(transferMap: Map<string, number>) {
    return Array.from(transferMap, ([productId, quantity]) => ({ productId, quantity }))
  }

  private async buildTransferredActivity(
    user: any,
    originalOrderTracking: any,
    cancelReason: string,
    comment: string,
    fromStore: any,
    toStore: any
  ) {
    const storeChangeActivity = await AppDataModel.findOne({
      type: CONSTANTS.TYPE.TRACKING_STATUS,
      statusCode: 'order_transferred_to_another_shop'
    }).lean()

    const cancelReasonData = await AppDataModel.findOne({
      type: CONSTANTS.TYPE.STORE_TRANSFER_REASON,
      statusCode: cancelReason
    }).lean()

    const transferredActivity = {
      label: `Order Transfered from ${fromStore?.storeCode} to ${toStore?.storeCode}`,
      date: new Date(),
      authorName: user?.name,
      authorId: user?._id?.toString?.(),
      comment: `${cancelReasonData?.name ?? cancelReason} - ${comment}`,
      statusCode: storeChangeActivity?.statusCode,
      previousStoreId: originalOrderTracking.store,
      isPartialTransfer: true
    }

    return { storeChangeActivity, transferredActivity }
  }

  private async splitAndCloneItems(
    originalItems: any[],
    transferMap: Map<string, number>
  ): Promise<{
    transferredOrderItemIds: Types.ObjectId[]
    balanceOrderItemIds: Types.ObjectId[]
    transferredUnitsSum: number
  }> {
    const transferredOrderItemIds: Types.ObjectId[] = []
    const balanceOrderItemIds: Types.ObjectId[] = []
    let transferredUnitsSum = 0

    for (const originalItem of originalItems) {
      const productId = originalItem.product.toString()
      const originalQty = Number(originalItem.quantity) || 0
      const reqQty = transferMap.get(productId) || 0
      const transferQty = Math.max(0, Math.min(reqQty, originalQty))
      const balanceQty = Math.max(0, originalQty - transferQty)

      // Base fields copy
      const baseItem = {
        order: originalItem.order,
        product: originalItem.product,
        amount: originalItem.amount,
        discountAmount: originalItem.discountAmount,
        currency: originalItem.currency,
        user: originalItem.user,
        // batchNo: originalItem.batchNo,
        gstDetails: originalItem.gstDetails,
        status: originalItem.status,
        isCancelRequested: originalItem.isCancelRequested,
        isReturnRequested: originalItem.isReturnRequested,
        returnDetails: originalItem.returnDetails,
        cancellationDetails: originalItem.cancellationDetails,
        suggestedStoreId: originalItem.suggestedStoreId,
        suggestedBatchNo: originalItem.suggestedBatchNo,
        isPrescriptionRequired: originalItem.isPrescriptionRequired,
        parentOrderItem: originalItem._id // lineage
      }

      // Create transferred clone if > 0
      if (transferQty > 0) {
        const newTransferred: any = await OrderItemModel.create({
          ...baseItem,
          quantity: transferQty
        })
        transferredOrderItemIds.push(newTransferred._id)
        transferredUnitsSum += transferQty
      }

      // Create balance clone if > 0 (includes untouched items)
      if (balanceQty > 0) {
        const newBalance: any = await OrderItemModel.create({
          ...baseItem,
          quantity: balanceQty
        })
        balanceOrderItemIds.push(newBalance._id)
      }
    }

    return { transferredOrderItemIds, balanceOrderItemIds, transferredUnitsSum }
  }

  private async createNewTrackings(args: {
    originalOrderTracking: any
    transferredOrderItemIds: Types.ObjectId[]
    balanceOrderItemIds: Types.ObjectId[]
    transferredStoreId: any
    orderId: any
    transferredActivity: any
    balanceActivity: any
    storeChangeActivity: any
  }) {
    const {
      originalOrderTracking,
      transferredOrderItemIds,
      balanceOrderItemIds,
      transferredStoreId,
      orderId,
      transferredActivity,
      balanceActivity,
      storeChangeActivity
    } = args

    const totalOrderTracking = await OrderItemTrackingModal.countDocuments({
      order: new Types.ObjectId(orderId),
      type: 'order'
    })

    const transferredTracking = await OrderItemTrackingModal.create({
      type: 'order',
      items: transferredOrderItemIds,
      store: new Types.ObjectId(transferredStoreId),
      order: new Types.ObjectId(orderId),
      status: 'pending',
      timeline: [...originalOrderTracking?.timeline, transferredActivity],
      lastTimelineStatus: storeChangeActivity?.statusCode,
      parentOrderTracking: originalOrderTracking._id,
      isSplitted: true,
      splitTrackingId: `${totalOrderTracking + 1}`,
      deliveryMode: originalOrderTracking?.deliveryMode
    })

    let balanceTracking: any = null
    if (balanceOrderItemIds.length > 0) {
      balanceTracking = await OrderItemTrackingModal.create({
        type: 'order',
        items: balanceOrderItemIds,
        store: originalOrderTracking.store,
        order: new Types.ObjectId(orderId),
        status: 'pending',
        timeline: [...originalOrderTracking?.timeline, balanceActivity],
        lastTimelineStatus: storeChangeActivity?.statusCode,
        parentOrderTracking: originalOrderTracking._id,
        deliveryMode: originalOrderTracking?.deliveryMode,
        hasPrescriptionVerification: originalOrderTracking?.hasPrescriptionVerification,
        isSplitted: true,
        splitTrackingId: `${totalOrderTracking + 2}`
      })
    }

    return { transferredTracking, balanceTracking }
  }

  private async pointItemsToTrackings(itemIds: Types.ObjectId[], trackingId: any) {
    await OrderItemModel.updateMany({ _id: { $in: itemIds } }, { orderTracking: trackingId })
  }

  private async notifyTargetStoreUsers(
    store: any,
    {
      orderId,
      transferredUnitsSum,
      transferredLinesCount
    }: { orderId: any; transferredUnitsSum: number; transferredLinesCount: number }
  ) {
    const storeUsers = await StoreAdminUserModal.find({ storeIds: store._id }).lean()
    for (const storeUser of storeUsers) {
      notificationServices.adminNotifications.sendNotificationToUser(storeUser._id, {
        recipientId: storeUser._id,
        recipientType: 'admin',
        title: 'Partial Order Transfer',
        message: `A partial order (${transferredUnitsSum} unit(s)) has been transferred to your store`,
        type: 'order',
        data: {
          orderId,
          transferredItemsCount: transferredLinesCount,
          transferredUnits: transferredUnitsSum
        },
        isRead: false,
        createdAt: moment().toDate(),
        priority: 'normal'
      })
    }
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
