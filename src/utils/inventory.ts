import mongoose from 'mongoose'
import { StoreInventoryModel } from '../services/store-inventory/store-inventory.schema'
import { InventoryStockModel } from '../services/inventory-stock/inventory-stock.schema'
import { OrderItemTrackingModal } from '../services/order-item-tracking/order-item-tracking.schema'
import { OrderItemModel } from '../services/order-items/order-items.schema'
import { CheckoutSessionModel } from '../services/order/order.schema'
import { triggerEmailBasedOnStocks } from './outOfStock'
import moment from 'moment-timezone'
import { logger } from '../logger'

export type TUpdateProductStock = {
  storeId: string | mongoose.Types.ObjectId
  productId: string | mongoose.Types.ObjectId
  operation: 'add' | 'remove'
  quantity: number
  batchNo: string
  expiryDate?: Date
}

const lastOutOfStockReminderSentTime = new Map<string, string>() // storeId_productId, YYYY-MM-DD
const lastLowStockReminderSentTime = new Map<string, string>() // storeId_productId, YYYY-MM-DD

/**\
 * Use only this method to update the stock to keep stock in sync
 * @param params
 */
export const updateProductStock = async (params: TUpdateProductStock) => {
  const {
    storeId: storeIdParam,
    productId: productIdParam,
    quantity,
    operation,
    batchNo,
    expiryDate
  } = params
  // console.log('[inventory] updateProductStock --- ', JSON.stringify(params))
  const storeId =
    storeIdParam instanceof mongoose.Types.ObjectId ? storeIdParam : new mongoose.Types.ObjectId(storeIdParam)
  const productId =
    productIdParam instanceof mongoose.Types.ObjectId
      ? productIdParam
      : new mongoose.Types.ObjectId(productIdParam)

  const inventory = await StoreInventoryModel.findOne({ storeId, productId }).lean()

  if (!inventory) throw new Error('Inventory not found')

  const batches = inventory.batches || []
  let batch = batches.find((b) => b.batchNo === batchNo)

  const currentStock = inventory.stock ?? 0
  let newStock: number
  if (operation === 'add') {
    newStock = currentStock + quantity
    if (!batch) {
      if (!expiryDate) throw new Error('Expiry date not provided for new batch')
      batch = { stock: quantity, batchNo, expiryDate, createdAt: new Date() }
      batches.push(batch)
    } else {
      batch.stock = batch.stock + quantity
    }
  } else {
    if (!batch) throw new Error('No products with given batch available in inventory')
    newStock = currentStock - quantity
    batch.stock = Math.max(batch.stock - quantity, 0)
    if (batch.stock < 0) throw new Error('Stock can not be negative for given batch no')
  }

  // if (newStock < 0) throw new Error('Stock cannot be negative')

  newStock = Math.max(newStock, 0)

  await StoreInventoryModel.updateOne({ _id: inventory?._id }, { stock: newStock, batches })

  // Trigger medicine remainder notification if stock was added and is now available
  if (operation === 'add' && newStock > 0) {
    try {
      const { addToMedicineRemainderStockNotificationQueue } = await import('../jobs/queues/queue')
      await addToMedicineRemainderStockNotificationQueue({
        storeId: storeId.toString(),
        productId: productId.toString(),
        newStock,
        operation
      })
      // console.log(
      //   `Medicine remainder notification queued for store: ${storeId}, product: ${productId}, newStock: ${newStock}`
      // )
    } catch (error) {
      console.error('Error queuing medicine remainder notification:', error)
      // Don't throw error to avoid breaking the stock update process
    }
  }

  return newStock
}

export type TAddInventoryStockEntry = {
  storeId: string | mongoose.Types.ObjectId
  productId: string | mongoose.Types.ObjectId
  updatedBy: string | mongoose.Types.ObjectId
  operation: 'add' | 'remove'
  reason?: string
  quantity: number
  batchNo: string
  expiryDate?: Date
  isFromUpload?: boolean
}
export const addInventoryStockEntry = async (params: TAddInventoryStockEntry) => {
  const {
    storeId: storeIdParam,
    productId: productIdParam,
    quantity,
    updatedBy: updatedByParam,
    operation,
    reason,
    batchNo,
    expiryDate,
    isFromUpload
  } = params

  const storeId =
    storeIdParam instanceof mongoose.Types.ObjectId ? storeIdParam : new mongoose.Types.ObjectId(storeIdParam)
  const productId =
    productIdParam instanceof mongoose.Types.ObjectId
      ? productIdParam
      : new mongoose.Types.ObjectId(productIdParam)
  const updatedBy =
    updatedByParam instanceof mongoose.Types.ObjectId
      ? updatedByParam
      : new mongoose.Types.ObjectId(updatedByParam)

  const updatedStock = await updateProductStock({
    storeId,
    productId,
    operation,
    quantity,
    batchNo,
    expiryDate
  })

  if (isFromUpload) return

  return (
    await InventoryStockModel.create({
      storeId,
      productId,
      quantity,
      updatedStock,
      operation,
      reason,
      createdBy: updatedBy,
      createdAt: new Date(),
      batchNo
    })
  ).toObject()
}

const validateBatchNo = async ({
  storeId,
  productId,
  quantity,
  batchNo
}: {
  storeId: string | mongoose.Types.ObjectId
  productId: string | mongoose.Types.ObjectId
  quantity: number
  batchNo: string
}) => {
  if (typeof storeId === 'string') storeId = new mongoose.Types.ObjectId(storeId)
  if (typeof productId === 'string') productId = new mongoose.Types.ObjectId(productId)

  const inventory = await StoreInventoryModel.findOne({
    storeId: storeId,
    productId: productId
  }).lean()
  if (!inventory) throw new Error('Product not added in inventory for this store')

  const batches = inventory.batches ?? []
  const batch = batches.find((b) => b.batchNo === batchNo)
  if (!batch) throw new Error('No stock with given batch no found')
  if (batch.stock < quantity) throw new Error('Not enough quantity available')

  return true
}

export const manageProductQuantityFromOrderTrackingId = async (
  orderTrackingId: string,
  operation: 'add' | 'remove',
  productBatches?: { productId: string; batchNo: string }[]
) => {
  const orderItemsTracking: any = await OrderItemTrackingModal.findById(orderTrackingId)
    .populate('store')
    .populate('items')
    .lean()
  if (!orderItemsTracking) throw new Error('Order tracking not found')

  const { store } = orderItemsTracking
  for (const item of orderItemsTracking.items) {
    if (item.isCancelRequested || item.isReturnRequested) continue

    // console.log(
    //   '[inventory] === manageProductQuantityFromOrderTrackingId  ',
    //   JSON.stringify({
    //     storeId: store._id.toString(),
    //     productId: item.product.toString(),
    //     operation: operation,
    //     quantity: item.quantity
    //   })
    // )

    let batchNo
    if (operation === 'remove') {
      if (!productBatches?.length) throw new Error('Batch no is not provided')
      const productBatch = productBatches.find((pb) => pb.productId === item.product.toString())
      if (!productBatch) throw new Error('Batch no not provided for this product')
      batchNo = productBatch.batchNo
      const isValid = await validateBatchNo({
        storeId: store._id,
        productId: item.product.toString(),
        quantity: item.quantity,
        batchNo
      })
    } else {
      batchNo = item.batchNo
      if (!batchNo) throw new Error('Batch no not added for given product')
    }

    const stockAfterUpdate = await updateProductStock({
      storeId: store._id.toString(),
      productId: item.product.toString(),
      quantity: item.quantity,
      operation: operation,
      batchNo
    })

    if (operation === 'add') {
      await OrderItemModel.findByIdAndUpdate(item._id, { $unset: { batchNo: 1 } })
    }
    const { sendOutOfStockReminder, sendLowStockReminder } = isSendReminder(
      store._id.toString(),
      item.product.toString()
    )

    const {
      low_stock_threshold,
      out_of_stock_threshold,
      low_stock_threshold_status,
      out_of_stock_threshold_status
    } = store?.storeSettings
    if (
      (low_stock_threshold_status && stockAfterUpdate < low_stock_threshold && sendLowStockReminder) ||
      (out_of_stock_threshold_status && stockAfterUpdate < out_of_stock_threshold && sendOutOfStockReminder)
    ) {
      const type = stockAfterUpdate < low_stock_threshold ? 'low' : 'out'
      triggerEmailBasedOnStocks(store._id.toString(), item.product.toString(), type, stockAfterUpdate)
    }
  }
}

export const checkStoreHasEnoughQuantity = async (
  storeId: string,
  products: { productId: string; quantity: number }[]
) => {
  const inventoryItems = await StoreInventoryModel.find({
    storeId: new mongoose.Types.ObjectId(storeId),
    productId: { $in: products.map((p) => new mongoose.Types.ObjectId(p.productId)) }
  })
    .select('productId stock softHoldCount softHoldForOrderCount')
    .lean()

  const inventoryMap = new Map(inventoryItems.map((item) => [item.productId.toString(), item]))

  const available = products.every((p) => {
    const item = inventoryMap.get(p.productId)
    return item
      ? item.stock - (item.softHoldCount ?? 0) - (item.softHoldForOrderCount ?? 0) >= p.quantity
      : false
  })

  return {
    available: !inventoryItems.length ? false : available,
    inventoryItems
  }
}

export const releaseSoftHoldQuantity = async (orderId: string) => {
  const trackingItems: any = await OrderItemTrackingModal.find({ order: orderId, isDeleted: { $ne: true } })
    .populate('items')
    .lean()
  const checkoutSession: any = await CheckoutSessionModel.findOne({ orderId }).lean()
  if (!checkoutSession) return

  if (checkoutSession.items.some((item: any) => item.softHoldRelease)) {
    console.log('Soft hold already released =============')
    return
  }

  for (const trackingItem of trackingItems) {
    for (const item of trackingItem.items) {
      await StoreInventoryModel.findOneAndUpdate(
        { storeId: trackingItem.store, productId: item.product },
        { $inc: { softHoldCount: -1 * item.quantity } }
      )
    }
  }
  let checkoutItems = checkoutSession.items.map((item: any) => ({ ...item, softHoldRelease: true }))
  await CheckoutSessionModel.findByIdAndUpdate(checkoutSession._id, {
    items: checkoutItems,
    status: 'inactive'
  })
}

const isSendReminder = (storeId: string, productId: string) => {
  const todayDate = moment.tz('Asia/Kolkata').format('YYYY-MM-DD')
  const key = `${storeId}_${productId}`
  const lastOutOfStockSentTime = lastOutOfStockReminderSentTime.has(key)
    ? lastOutOfStockReminderSentTime.get(key)
    : ''
  const lastLowStockSentTime = lastLowStockReminderSentTime.has(key)
    ? lastLowStockReminderSentTime.get(key)
    : ''
  const sendOutOfStockReminder = todayDate !== lastOutOfStockSentTime
  const sendLowStockReminder = todayDate !== lastLowStockSentTime

  if (sendOutOfStockReminder) lastOutOfStockReminderSentTime.set(key, todayDate)
  if (sendLowStockReminder) lastLowStockReminderSentTime.set(key, todayDate)

  return { sendOutOfStockReminder, sendLowStockReminder }
}

export const softHoldForOrder = async ({ orderTrackingId }: { orderTrackingId: any }) => {
  const orderTracking = await OrderItemTrackingModal.findById(orderTrackingId).populate('items').lean()
  if (!orderTracking) throw new Error('Order tracking details not found')

  for (const item of orderTracking.items as any) {
    const inventory = await StoreInventoryModel.findOne({
      storeId: orderTracking.store,
      productId: item.product
    }).lean()

    // if (!inventory) throw new Error('Item not found in inventory')
    if (inventory) {
      await StoreInventoryModel.findByIdAndUpdate(inventory._id, {
        $inc: { softHoldForOrderCount: item.quantity }
      })
    } else {
      // CHECK TODO

      logger.log('Error: Inventory item not found for the store Id ==>', {
        storeId: orderTracking.store,
        productId: item.product
      })
    }
  }

  const checkoutSession = await CheckoutSessionModel.findOne({ orderId: orderTracking.order }, {}).lean()
  if (!checkoutSession) throw new Error('Checkout session not found')

  const checkoutItems = checkoutSession.items.map((i: any) => ({ ...i, orderHoldRelease: false }))
  await CheckoutSessionModel.findByIdAndUpdate(checkoutSession._id, { items: checkoutItems })
}

export const releaseOrderSoftHold = async ({ orderTrackingId }: { orderTrackingId: any }) => {
  const orderTracking = await OrderItemTrackingModal.findById(orderTrackingId).populate('items').lean()
  if (!orderTracking) throw new Error('Order tracking details not found')

  for (const item of orderTracking.items as any) {
    const inventory = await StoreInventoryModel.findOne({
      storeId: orderTracking.store,
      productId: item.product
    }).lean()

    // Check TODO
    // if (!inventory) throw new Error('Item not found in inventory')

    if (inventory) {
      await StoreInventoryModel.findByIdAndUpdate(inventory._id, {
        $inc: { softHoldForOrderCount: -1 * item.quantity }
      })
    } else {
      // CHECK TODO
      logger.log('Error: Inventory item not found for the store Id ==>', {
        storeId: orderTracking.store,
        productId: item.product
      })
    }
  }

  const checkoutSession = await CheckoutSessionModel.findOne({ orderId: orderTracking.order }, {}).lean()
  if (!checkoutSession) throw new Error('Checkout session not found')
  const checkoutItems = checkoutSession.items.map((i: any) => ({ ...i, orderHoldRelease: true }))
  await CheckoutSessionModel.findByIdAndUpdate(checkoutSession._id, { items: checkoutItems })
}
