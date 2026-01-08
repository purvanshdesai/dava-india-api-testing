// order.service.get.refactor.ts

import promiseLimit from 'promise-limit' // npm i promise-limit
import { OrderModel } from '../services/order/order.schema'
import { PaymentModel } from '../services/payment/payment.schema'
import {
  OrderItemTrackingModal,
  CONSTANTS as ORDER_ITEM_TRACKING_CONSTANTS
} from '../services/order-item-tracking/order-item-tracking.schema'
import { RefundModal } from '../services/refund/refund.schema'
import { StoreInventoryModel } from '../services/store-inventory/store-inventory.schema'
import { PACKAGE_SPCECS } from '../constants/general'
import { app } from '../app'

type AdapterId = any
type SuperAdminOrdersParams = any

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000
const INVOICE_CONCURRENCY = 5 // tune this for your infra

// -------------------- Utility helpers --------------------
export function key(storeId: any, productId: any) {
  return `${String(storeId)}:${String(productId)}`
}

export function shallowClone<T = any>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj
  return Array.isArray(obj) ? (obj.slice() as unknown as T) : ({ ...obj } as T)
}

// -------------------- Data fetching functions --------------------

// 1) Fetch order (only fields you need)
export async function fetchOrder(id: AdapterId) {
  // adjust select() to only include necessary fields from order if possible
  return OrderModel.findById(id).populate('patientId').lean()
}

// 2) Fetch payment, trackings, refunds in parallel (projections used)
export async function fetchPaymentTrackingsRefunds(order: any, storeId: string) {
  const paymentQ = PaymentModel.findOne({
    order: order._id,
    paymentOrderId: order.paymentOrderId
  })
    .select('transactionId paymentOrderId status amount createdAt')
    .lean()

  let baseQuery: any = {
    order: order._id,
    isDeleted: { $ne: true }
  }

  if (storeId) baseQuery.store = storeId

  const trackingsQ = OrderItemTrackingModal.find({
    ...baseQuery
  })
    .populate({
      path: 'store',
      select: '_id storeName storeCode phoneNumber'
    })
    .populate({
      path: 'items',
      populate: {
        path: 'product',
        select: '_id title sku images thumbnail unitPrice finalPrice taxes'
      }
    })
    .lean()

  const refundsQ = RefundModal.find({ order: order._id }).select('_id amount paymentId').lean()

  const [payment, trackingsRaw, refunds] = await Promise.all([paymentQ, trackingsQ, refundsQ])
  const trackings: any[] = trackingsRaw ?? []

  // --- Repair: detect cancel/return trackings that missed items ---
  const cancelTypes = new Set([
    ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.RETURN,
    ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.CANCEL,
    ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.PARTIAL_CANCEL,
    ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.PARTIAL_RETURN
  ])

  const cancelTrackingsMissingItems = trackings.filter((t: any) => cancelTypes.has(t.type))

  if (cancelTrackingsMissingItems.length) {
    try {
      const itemIds = cancelTrackingsMissingItems.map((t: any) => t._id)

      const reFetched = await OrderItemTrackingModal.find({ _id: { $in: itemIds } })
        .populate({
          path: 'items',
          populate: {
            path: 'product',
            select: '_id title sku images thumbnail unitPrice finalPrice taxes'
          }
        })
        .populate({
          path: 'store',
          select: '_id storeName storeCode phoneNumber'
        })
        .lean()

      if (reFetched?.length) {
        const reById = new Map(reFetched.map((r: any) => [String(r._id), r]))

        // Build inventory index to populate batches
        const allOrderTrackings = trackings.filter(
          (t: any) => t.type === ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.ORDER
        )
        const inventoryPairs = buildInventoryPairs(allOrderTrackings)
        const inventories = await fetchInventories(inventoryPairs)
        const invIndex = new Map<string, any>()
        for (const inv of inventories) invIndex.set(key(inv.storeId, inv.productId), inv)

        for (let i = 0; i < trackings.length; i++) {
          const origTracking = trackings[i]
          const origId = String(origTracking._id)

          if (reById.has(origId)) {
            const refetched = reById.get(origId)

            // Build a snapshot for each item, include the re-fetched items array
            const snapshotForItems = {
              ...trackingSnapshotForItem(refetched),
              items: (refetched.items ?? []).map((it: any) => {
                const prod = it.product
                if (prod) {
                  // Enrich batches
                  const inv = invIndex.get(key(refetched.store?._id, prod._id))
                  const batches: Array<{ batchNo: string; expiryDate: string | Date }> = []
                  const confirmedBatchNo = it?.batchNo // Already assigned/confirmed batch
                  const suggestedBatchNo = it?.suggestedBatchNo // System suggested batch

                  if (inv?.batches?.length) {
                    const needed = Number(it.quantity) || 0
                    const now = Date.now()
                    const addedBatchNos = new Set<string>()

                    // First, always include the confirmed/assigned batch (ignore stock and expiry checks)
                    if (confirmedBatchNo) {
                      const confirmedBatch = inv.batches.find((b: any) => b.batchNo === confirmedBatchNo)
                      if (confirmedBatch) {
                        // Always show confirmed batch regardless of stock or expiry
                        batches.push({
                          batchNo: confirmedBatch.batchNo,
                          expiryDate: confirmedBatch.expiryDate
                        })
                        addedBatchNos.add(confirmedBatch.batchNo)
                      }
                    }

                    // Then add other batches with sufficient stock (including suggested batch if it has stock)
                    for (const batch of inv.batches) {
                      // Skip if already added
                      if (addedBatchNos.has(batch.batchNo)) continue

                      // Check stock for all non-confirmed batches (including suggested)
                      if ((batch.stock ?? 0) >= needed) {
                        const exp = new Date(batch.expiryDate).getTime()
                        if (exp - now > NINETY_DAYS_MS) {
                          batches.push({ batchNo: batch.batchNo, expiryDate: batch.expiryDate })
                          addedBatchNos.add(batch.batchNo)
                        }
                      }
                    }
                  }
                  prod.batches = batches
                }
                return { ...it }
              })
            }

            // Attach to each item in the original tracking WITHOUT overwriting origTracking.items
            for (const item of origTracking.items ?? []) {
              if (!item) continue
              if (refetched.type === ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.CANCEL) {
                item.cancelTracking = snapshotForItems
              } else {
                item.returnTracking = snapshotForItems
              }

              // lastActivity from timeline
              const tl = refetched.timeline ?? []
              if (tl.length) item.lastActivity = tl[tl.length - 1]?.statusCode
            }

            // Replace original tracking in main array (optional)
            trackings[i] = refetched
          }
        }
      }
    } catch (refetchErr) {
      console.warn('Refetch cancel/return trackings failed', refetchErr)
    }
  }

  return { payment, trackings, refunds: refunds ?? [] }
}

// 3) Build cancel/return index (last timeline length wins)
export function buildCancelReturnIndex(trackings: any[]) {
  const cancelTypes = new Set([
    ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.RETURN,
    ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.CANCEL,
    ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.PARTIAL_CANCEL,
    ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.PARTIAL_RETURN
  ])

  const map = new Map<string, any>()
  for (const t of trackings) {
    if (!cancelTypes.has(t.type)) continue
    for (const it of t.items ?? []) {
      const id = String(it?._id)
      const prev = map.get(id)
      if (!prev || (t.timeline?.length ?? 0) >= (prev.timeline?.length ?? 0)) {
        map.set(id, shallowClone(t))
      }
    }
  }
  return map
}

// 4) Build unique inventory filter pairs
export function buildInventoryPairs(onlyOrderTrackings: any[]) {
  const seen = new Set<string>()
  const pairs: Array<{ storeId: any; productId: any }> = []
  for (const tr of onlyOrderTrackings) {
    const sId = tr?.store?._id
    if (!sId) continue
    for (const it of tr.items ?? []) {
      const pId = it?.product?._id
      if (!pId) continue
      const k = key(sId, pId)
      if (!seen.has(k)) {
        seen.add(k)
        pairs.push({ storeId: sId, productId: pId })
      }
    }
  }
  return pairs
}

// 5) Fetch inventories, projected (batches only)
export async function fetchInventories(pairs: Array<{ storeId: any; productId: any }>) {
  if (!pairs.length) return []
  // convert pairs to an $or query - index this collection by storeId+productId for speed
  return StoreInventoryModel.find({ $or: pairs }).select('storeId productId batches').lean()
}

// 6) Enrichment per tracking (sequential per tracking but invoice generation bounded)
export async function enrichOrderTrackings(
  onlyOrderTrackings: any[],
  invIndex: Map<string, any>,
  trackingByItemId: Map<string, any>,
  params?: SuperAdminOrdersParams
) {
  // Create a concurrency limiter for invoice generation calls
  const limit = promiseLimit(INVOICE_CONCURRENCY)
  const invoiceTasks: Array<() => Promise<void>> = []

  // Enrich each tracking; keep this loop sequential to avoid accumulating huge temp arrays
  for (const orderTracking of onlyOrderTrackings) {
    const storeId = orderTracking?.store?._id

    // package specs (small)
    const pkg = orderTracking?.packageSize === 'big' ? PACKAGE_SPCECS.BIG : PACKAGE_SPCECS.SMALL
    if (pkg) {
      const { type, length, width, breadth, weight } = pkg
      const label = type?.charAt(0)?.toUpperCase() + type?.slice(1)?.toLowerCase()
      orderTracking.packageSpecs = `${label} (${weight} kg, Dimension: ${breadth}x${length}x${width})`
    }

    // last logistics status (reverse loop)
    const tl: any[] = orderTracking?.timeline ?? []
    for (let i = tl.length - 1; i >= 0; i--) {
      if (tl[i]?.type === 'logistics') {
        orderTracking.trackingStatus = tl[i]?.label
        break
      }
    }

    // if dispatched & no invoiceUrl, schedule invoice fetch as bounded concurrency job
    const hasDispatched = tl.some((x) => x?.statusCode === 'dispatched')
    if (hasDispatched && !orderTracking?.invoiceUrl) {
      invoiceTasks.push(async () => {
        try {
          const resp = await app.service('downloads/invoice').get(String(orderTracking._id), params as any)
          if (resp?.invoiceUrl) orderTracking.invoiceUrl = resp.invoiceUrl
        } catch (err: any) {
          // log and continue - never throw
          console.warn('Invoice generation failed for', orderTracking._id, err?.message ?? err)
        }
      })
    }

    // enrich items (batches + attach cancel/return)
    for (const item of orderTracking.items ?? []) {
      const product = item?.product
      if (!product) continue

      // fetch inventory from map
      const inv = invIndex.get(key(storeId, product._id))
      const batches: Array<{ batchNo: string; expiryDate: string | Date }> = []
      const confirmedBatchNo = item?.batchNo // Already assigned/confirmed batch
      const suggestedBatchNo = item?.suggestedBatchNo // System suggested batch

      if (inv?.batches?.length) {
        const needed = Number(item.quantity) || 0
        const now = Date.now()
        const addedBatchNos = new Set<string>()

        // First, always include the confirmed/assigned batch (ignore stock and expiry checks)
        if (confirmedBatchNo) {
          const confirmedBatch = inv.batches.find((b: any) => b.batchNo === confirmedBatchNo)
          if (confirmedBatch) {
            // Always show confirmed batch regardless of stock or expiry
            batches.push({ batchNo: confirmedBatch.batchNo, expiryDate: confirmedBatch.expiryDate })
            addedBatchNos.add(confirmedBatch.batchNo)
          }
        }

        // Then add other batches with sufficient stock (including suggested batch if it has stock)
        for (const batch of inv.batches) {
          // Skip if already added
          if (addedBatchNos.has(batch.batchNo)) continue

          // Check stock for all non-confirmed batches (including suggested)
          if ((batch.stock ?? 0) >= needed) {
            const exp = new Date(batch.expiryDate).getTime()
            if (exp - now > NINETY_DAYS_MS) {
              batches.push({ batchNo: batch.batchNo, expiryDate: batch.expiryDate })
              addedBatchNos.add(batch.batchNo)
            }
          }
        }
      }
      product.batches = batches

      // attach last cancel/return if exists
      const t = trackingByItemId.get(String(item?._id))
      if (t) {
        const snapshot = trackingSnapshotForItem(t) // <-- safe copy, no `items` inside
        if (t.type === ORDER_ITEM_TRACKING_CONSTANTS.TRACKING_TYPE.CANCEL) {
          item.cancelTracking = snapshot
        } else {
          item.returnTracking = snapshot
        }

        const tl = t.timeline ?? []
        if (tl.length) {
          item.lastActivity = tl[tl.length - 1]?.statusCode
        }
      }
    }
  }

  // run invoice tasks with concurrency limit
  await Promise.all(invoiceTasks.map((fn) => limit(fn)))
}
// return a tracking object suitable for attaching to an item (no `items` field, no circular refs)
function trackingSnapshotForItem(t: any) {
  if (!t || typeof t !== 'object') return t
  // pick the fields you care about. Example: _id, type, timeline, status, store, createdAt
  // Adjust fields based on what your UI needs.
  const {
    _id,
    type,
    timeline,
    statusCode,
    label,
    store,
    reason,
    createdAt,
    updatedAt
    // ... any other small primitive fields you need
  } = t

  // Make a JSON-safe copy of timeline (if timeline contains Date/ObjectIds it's fine).
  // If timeline may contain circular refs (unlikely) you can do more sanitizing.
  const timelineCopy = Array.isArray(timeline) ? timeline.map((x: any) => ({ ...x })) : timeline

  return {
    _id,
    type,
    timeline: timelineCopy,
    statusCode,
    label,
    store,
    reason,
    createdAt,
    updatedAt
  }
}
