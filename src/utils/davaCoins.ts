import { OrderItemModel, OrderItems } from '../services/order-items/order-items.schema'
import { CartItem } from '../services/carts/carts.schema'
import { DavaCoinsHistoryModel } from '../services/dava-coins-history/dava-coins-history.schema'
import { UsersModel } from '../services/users/users.schema'
import moment from 'moment'
import { Order as OrderData, OrderModel } from '../services/order/order.schema'

type Allocation = {
  itemId: string
  index: number
  itemTotal: number // amount * quantity
  exactShare: number // exact fractional coins for debugging
  flooredShare: number // initial Math.floor(exactShare)
  remainder: number // exactShare - flooredShare
  allocatedCoins: number // final integer allocation
}

type DynamicObject = {
  [key: string]: number
}

type DistributeResult = {
  allocations: Allocation[]
  productWiseCoinsAllocated: DynamicObject
  totalRequested: number
  totalAllocated: number
  cappedToOrderTotal: boolean
}

type ProcessCancelResult = {
  productId?: string | number
  totalQty: number
  cancelQty: number
  remainingQty: number
  originalAllocatedCoins: number
  refundedCoins: number // coins returned to user for cancelled qty
  remainingAllocatedCoins: number // coins left allocated for the product (for remainingQty)
  debug?: {
    exactCanceledShare: number
    exactRemainingShare: number
    flooredCanceled: number
    flooredRemaining: number
    canceledRemainder: number
    remainingRemainder: number
    leftoverToDistribute: number
    tieBreakerUsed: 'remaining' | 'canceled'
  }
}

/**
 * Distribute integer 'appliedCoins' across cart items proportionally to (amount * quantity).
 *
 * @param items - array of cart items with amount and quantity
 * @param appliedCoins - integer number of coins to allocate
 * @param options - optional:
 *   - capToOrderTotal (default true): if true, max usable coins = floor(sum of itemTotals)
 *
 * @returns allocations and summary; allocated coins sum equals returned totalAllocated.
 */

function parseAllocations(allocations: Allocation[]) {
  return allocations.reduce((acc: DynamicObject, it: Allocation) => {
    acc[it.itemId] = it.allocatedCoins
    return acc
  }, {})
}

function distributeDavaCoins(
  items: CartItem[],
  appliedCoins: number,
  options?: { capToOrderTotal?: boolean }
): DistributeResult {
  const capToOrderTotal = options?.capToOrderTotal ?? true

  // Normalize inputs
  const sanitizedAppliedCoins = Math.max(0, Math.floor(Number(appliedCoins) || 0))
  const itemTotals = items.map((it) => {
    const price = Number(it.amount) || 0
    const qty = Math.max(0, Math.floor(Number(it.quantity) || 0))
    return price * qty
  })

  const orderTotal = itemTotals.reduce((s, v) => s + v, 0)

  let usableCoins = sanitizedAppliedCoins
  let capped = false
  if (capToOrderTotal) {
    // maximum sensible coins is floor(orderTotal) (no decimals allowed)
    const maxCoins = Math.floor(orderTotal)
    if (usableCoins > maxCoins) {
      usableCoins = maxCoins
      capped = true
    }
  }

  // Edge cases
  if (usableCoins <= 0 || orderTotal <= 0) {
    const allocations: Allocation[] = items.map((it, idx) => ({
      itemId: it.productId?.toString(),
      index: idx,
      itemTotal: itemTotals[idx],
      exactShare: 0,
      flooredShare: 0,
      remainder: 0,
      allocatedCoins: 0
    }))
    return {
      allocations,
      productWiseCoinsAllocated: parseAllocations(allocations),
      totalRequested: sanitizedAppliedCoins,
      totalAllocated: 0,
      cappedToOrderTotal: capped
    }
  }

  // Compute exact share for each item
  const exactShares = itemTotals.map((t) => (orderTotal > 0 ? (usableCoins * t) / orderTotal : 0))

  // Initial floor allocation
  const floored = exactShares.map((s) => Math.floor(s))
  const remainders = exactShares.map((s, i) => s - floored[i])

  let allocated = floored.slice()
  let allocatedSum = allocated.reduce((a, b) => a + b, 0)
  let remaining = usableCoins - allocatedSum

  // Prepare array of indices sorted by descending remainder (tie-breaker: larger itemTotal)
  const indices = items.map((_, i) => i)
  indices.sort((a, b) => {
    // sort by remainder desc, then by itemTotal desc, then by index asc
    if (remainders[b] !== remainders[a]) return remainders[b] - remainders[a]
    if (itemTotals[b] !== itemTotals[a]) return itemTotals[b] - itemTotals[a]
    return a - b
  })

  // Optional per-item cap: cannot allocate more coins than floor(itemTotal)
  const perItemCap = itemTotals.map((t) => Math.floor(t))

  // Distribute remaining coins to highest remainders, respecting per-item cap
  for (const idx of indices) {
    if (remaining <= 0) break
    const canAccept = perItemCap[idx] - allocated[idx]
    if (canAccept <= 0) continue
    const give = Math.min(1, canAccept) // we distribute one-by-one in remainder order
    allocated[idx] += give
    remaining -= give
  }

  // If still remaining (because some items reached per-item cap), distribute to any item with capacity
  if (remaining > 0) {
    for (let pass = 0; pass < 2 && remaining > 0; pass++) {
      for (let i = 0; i < items.length && remaining > 0; i++) {
        const idx = i
        const canAccept = perItemCap[idx] - allocated[idx]
        if (canAccept <= 0) continue
        const give = Math.min(canAccept, remaining)
        allocated[idx] += give
        remaining -= give
      }
    }
  }

  // If still remaining (rare, e.g., appliedCoins > sum of floor(itemTotals) and cap disabled), give arbitrarily
  if (remaining > 0) {
    for (let i = 0; i < items.length && remaining > 0; i++) {
      allocated[i] += 1
      remaining -= 1
    }
  }

  allocatedSum = allocated.reduce((a, b) => a + b, 0)

  const allocations: Allocation[] = items.map((it, idx) => ({
    itemId: it.productId?.toString(),
    index: idx,
    itemTotal: itemTotals[idx],
    exactShare: Number(exactShares[idx].toFixed(10)),
    flooredShare: floored[idx],
    remainder: Number(remainders[idx].toFixed(10)),
    allocatedCoins: allocated[idx]
  }))

  return {
    allocations,
    productWiseCoinsAllocated: parseAllocations(allocations),
    totalRequested: sanitizedAppliedCoins,
    totalAllocated: allocatedSum,
    cappedToOrderTotal: capped
  }
}

export const applyDavaCoinsProductLevel = (items: CartItem[], appliedCoins: number) => {
  const { productWiseCoinsAllocated } = distributeDavaCoins(items, appliedCoins)
  const productIds = Object.keys(productWiseCoinsAllocated)

  items.forEach((it) => {
    const prodIdStr = it.productId?.toString()
    if (productIds.includes(prodIdStr)) it.davaCoinsUsed = productWiseCoinsAllocated[prodIdStr]
  })
}

export const creditDavaCoinsFromCancelItem = async (order: OrderData, orderItem: OrderItems) => {
  try {
    // Debit dava coins from user
    await UsersModel.updateOne(
      { _id: orderItem?.user },
      { $inc: { davaCoinsBalance: orderItem?.davaCoinsUsed ?? 0 } }
    )

    await DavaCoinsHistoryModel.create({
      user: orderItem?.user,
      orderId: order?.orderId,
      coins: orderItem?.davaCoinsUsed,
      usageType: 'credit',
      description: `${orderItem?.davaCoinsUsed} dava coins credited for cancelling product from order #${order.orderId}`,
      createdAt: moment().toISOString(),
      updatedAt: moment().toISOString()
    })
  } catch (e) {}
}

export const debitDavaCoinsCreditedForMembership = async (order: OrderData, orderItem: OrderItems) => {
  try {
    const user = await UsersModel.findById(order?.userId)
      .select('_id hasDavaoneMembership davaCoinsBalance davaoneMembership')
      .lean()

    if (!user?.hasDavaoneMembership) return

    const items: any[] = await OrderItemModel.find({
      order: order?._id,
      $and: [
        { $or: [{ isCancelRequested: { $exists: false } }, { isCancelRequested: false }] },
        { $or: [{ isReturnRequested: { $exists: false } }, { isReturnRequested: false }] },
        { $or: [{ isPartialCancelRequested: { $exists: false } }, { isPartialCancelRequested: false }] },
        { $or: [{ isPartialReturnRequested: { $exists: false } }, { isPartialReturnRequested: false }] }
      ]
    }).lean()

    let davaCoins = 0

    if (items.length) {
      // 1. calculate current order total and provide dava coins
      const subTotal = items.reduce((acc, it) => acc + it.amount * it.quantity, 0)

      const orderTotal =
        subTotal +
        order.deliveryCharge +
        order.handlingCharge +
        order.packingCharge +
        order.platformFee -
        (order.discountedAmount ?? 0) -
        (order.davaCoinsUsed ?? 0)

      let percentage = 0

      // decide the percentage to credit
      if (orderTotal >= 0 && orderTotal <= 499) {
        percentage = 5
      } else if (orderTotal >= 500 && orderTotal <= 999) {
        percentage = 10
      } else if (orderTotal >= 1000) {
        percentage = 20
      }

      davaCoins = Math.floor((orderTotal * percentage) / 100)
    }

    // 2. minus davaCoinsCreditedForMembership in order

    // Add to order object
    await OrderModel.updateOne({ _id: order?._id }, { davaCoinsCreditedForMembership: davaCoins })

    // Credit dava coins to user
    // 3. remove existing davaCoinsCreditedForMembership from user davaCoinsBalance and add updated davaCoins

    const coins = (user?.davaCoinsBalance ?? 0) - (order?.davaCoinsCreditedForMembership ?? 0) + davaCoins
    const updatedCoins = coins < 0 ? 0 : coins

    await UsersModel.updateOne({ _id: user?._id }, { davaCoinsBalance: updatedCoins })

    // Add history
    await DavaCoinsHistoryModel.create({
      user: orderItem?.user,
      orderId: order?.orderId,
      coins: order?.davaCoinsCreditedForMembership ?? 0,
      usageType: 'debit',
      description: `Adjusting ${order?.davaCoinsCreditedForMembership ?? 0} dava coins for return product from order #${order.orderId}`,
      createdAt: moment().toISOString(),
      updatedAt: moment().toISOString()
    })

    if (davaCoins > 0) {
      await DavaCoinsHistoryModel.create({
        user: orderItem?.user,
        orderId: order?.orderId,
        coins: davaCoins,
        usageType: 'credit',
        description: `Updating ${davaCoins} dava coins credited for cancelling product from order #${order.orderId}`,
        createdAt: moment().toISOString(),
        updatedAt: moment().toISOString()
      })
    }
  } catch (e) {}
}

/**
 * Process partial cancellation for a single product.
 *
 * @param params.totalQty - original ordered quantity (integer > 0)
 * @param params.allocatedCoins - integer coins that were allocated to this product previously
 * @param params.cancelQty - how many units are being cancelled (integer >=0)
 * @param params.options.tieBreaker - 'remaining' | 'canceled' (when remainders tie); default 'remaining'
 */
export function processProductPartialCancellationWithDavaCoins(params: {
  productId?: string | number
  totalQty: number
  allocatedCoins: number
  cancelQty: number
  options?: { tieBreaker?: 'remaining' | 'canceled' }
}): ProcessCancelResult {
  const { productId, totalQty, allocatedCoins, cancelQty, options } = params
  const tieBreaker = options?.tieBreaker ?? 'remaining'

  // sanitize & normalize inputs
  const T = Math.max(0, Math.floor(Number(totalQty) || 0))
  const A = Math.max(0, Math.floor(Number(allocatedCoins) || 0))
  let C = Math.max(0, Math.floor(Number(cancelQty) || 0))

  if (T === 0) {
    // nothing to do
    return {
      productId,
      totalQty: T,
      cancelQty: C,
      remainingQty: 0,
      originalAllocatedCoins: A,
      refundedCoins: 0,
      remainingAllocatedCoins: 0,
      debug: {
        exactCanceledShare: 0,
        exactRemainingShare: 0,
        flooredCanceled: 0,
        flooredRemaining: 0,
        canceledRemainder: 0,
        remainingRemainder: 0,
        leftoverToDistribute: 0,
        tieBreakerUsed: tieBreaker
      }
    }
  }

  if (C <= 0) {
    // no cancellation
    return {
      productId,
      totalQty: T,
      cancelQty: 0,
      remainingQty: T,
      originalAllocatedCoins: A,
      refundedCoins: 0,
      remainingAllocatedCoins: A,
      debug: {
        exactCanceledShare: 0,
        exactRemainingShare: A,
        flooredCanceled: 0,
        flooredRemaining: A,
        canceledRemainder: 0,
        remainingRemainder: 0,
        leftoverToDistribute: 0,
        tieBreakerUsed: tieBreaker
      }
    }
  }

  if (C >= T) {
    // full cancellation
    return {
      productId,
      totalQty: T,
      cancelQty: T,
      remainingQty: 0,
      originalAllocatedCoins: A,
      refundedCoins: A,
      remainingAllocatedCoins: 0,
      debug: {
        exactCanceledShare: A,
        exactRemainingShare: 0,
        flooredCanceled: A,
        flooredRemaining: 0,
        canceledRemainder: 0,
        remainingRemainder: 0,
        leftoverToDistribute: 0,
        tieBreakerUsed: tieBreaker
      }
    }
  }

  const R = T - C // remaining quantity

  // Exact fractional shares
  const exactCanceledShare = (A * C) / T
  const exactRemainingShare = (A * R) / T

  // Floor allocations
  const flooredCanceled = Math.floor(exactCanceledShare)
  const flooredRemaining = Math.floor(exactRemainingShare)

  // Remainders
  const canceledRemainder = exactCanceledShare - flooredCanceled
  const remainingRemainder = exactRemainingShare - flooredRemaining

  // Sum of floored allocations and leftover coins to distribute
  const sumFloors = flooredCanceled + flooredRemaining
  let leftoverToDistribute = A - sumFloors // integer >= 0

  // Start with floored allocations
  let canceledAlloc = flooredCanceled
  let remainingAlloc = flooredRemaining

  // Distribute leftover coins (one by one) to the bucket with larger remainder.
  // If tie, follow tieBreaker option.
  while (leftoverToDistribute > 0) {
    if (canceledRemainder > remainingRemainder) {
      canceledAlloc += 1
    } else if (remainingRemainder > canceledRemainder) {
      remainingAlloc += 1
    } else {
      // tie
      if (tieBreaker === 'remaining') remainingAlloc += 1
      else canceledAlloc += 1
    }
    leftoverToDistribute -= 1
    // after giving an extra coin, we should slightly reduce its remainder so further coins (if many)
    // get distributed in a stable way. We'll reduce the chosen remainder by 1 (conceptually).
    // But since there are only two buckets, and leftoverToDistribute <= A, the simple loop is fine.
    // (No need to actually mutate remainders — the tie-breaker handles equalities deterministically.)
  }

  // Final sanity: ensure sums equal A
  const finalSum = canceledAlloc + remainingAlloc
  if (finalSum !== A) {
    // Fix any tiny discrepancy deterministically: give/take to remaining
    const diff = A - finalSum
    remainingAlloc += diff
  }

  return {
    productId,
    totalQty: T,
    cancelQty: C,
    remainingQty: R,
    originalAllocatedCoins: A,
    refundedCoins: canceledAlloc,
    remainingAllocatedCoins: remainingAlloc,
    debug: {
      exactCanceledShare: Number(exactCanceledShare.toFixed(10)),
      exactRemainingShare: Number(exactRemainingShare.toFixed(10)),
      flooredCanceled,
      flooredRemaining,
      canceledRemainder: Number(canceledRemainder.toFixed(10)),
      remainingRemainder: Number(remainingRemainder.toFixed(10)),
      leftoverToDistribute: A - (flooredCanceled + flooredRemaining),
      tieBreakerUsed: tieBreaker
    }
  }
}

export function getRedeemableDavaCoins(totalCartPrice: number, davaCoinBalance: number): number {
  if (totalCartPrice < 199) {
    return 0 // below minimum cart value for redemption
  }

  let maxPercentage = 0

  if (totalCartPrice >= 199 && totalCartPrice <= 499) {
    maxPercentage = 10
  } else if (totalCartPrice >= 500 && totalCartPrice <= 999) {
    maxPercentage = 15
  } else if (totalCartPrice >= 1000) {
    maxPercentage = 20
  }

  const maxRedeemableCoins = Math.floor((totalCartPrice * maxPercentage) / 100)

  // User can only redeem up to their balance
  return Math.min(davaCoinBalance, maxRedeemableCoins)
}
