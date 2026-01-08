/**
 * Order ID Generator using Redis Atomic Counter
 *
 * Prevents race condition when multiple users create orders simultaneously
 * by using Redis INCR command which is atomic and thread-safe.
 *
 * Maintains same numbering logic as countDocuments for backward compatibility.
 */

import redisCache from '../cache/redis'
import moment from 'moment'
import { OrderModel } from '../services/order/order.schema'

/**
 * Get next sequence number from Redis atomically
 * If the counter doesn't exist for this month, initialize it with current DB count
 *
 * @param key - Redis key for the counter
 * @param initializeCount - Function to get initial count from database
 * @returns Promise<number> - The next sequence number
 */
const getNextSequence = async (key: string, initializeCount: () => Promise<number>): Promise<number> => {
  const redis = redisCache.getInstance()

  // Check if counter exists for this month
  const exists = await redis.exists(key)

  if (!exists) {
    // Initialize with current database count to maintain same numbering
    const currentCount = await initializeCount()
    await redis.set(key, currentCount)
  }

  // INCR is atomic in Redis - perfect for preventing race conditions
  const sequence = await redis.incr(key)
  return sequence
}

/**
 * Generate unique order ID for pending orders
 * Format: p{MMYY}{sequence}
 * Example: If DB has 10 pending orders, next will be p112410, then p112411, etc.
 *
 * Maintains same logic as: countDocuments({ status: 'pending' })
 */
export const generatePendingOrderId = async (): Promise<string> => {
  const timestamp = moment().format('MMYY')
  const key = `order:pending:${timestamp}`

  // Initialize with current count of pending orders if counter doesn't exist
  const sequence = await getNextSequence(key, async () => {
    return await OrderModel.countDocuments({ status: 'pending' })
  })

  return `p${timestamp}${sequence}`
}

/**
 * Generate unique order ID for running/paid orders
 * Format: {MMYY}{sequence}
 * Example: If DB has 100 non-pending orders, next will be 1124100, then 1124101, etc.
 *
 * Maintains same logic as: countDocuments({ status: { $ne: 'pending' } })
 */
export const generateRunningOrderId = async (): Promise<string> => {
  const timestamp = moment().format('MMYY')
  const key = `order:running:${timestamp}`

  // Initialize with current count of non-pending orders if counter doesn't exist
  const sequence = await getNextSequence(key, async () => {
    return await OrderModel.countDocuments({ status: { $ne: 'pending' } })
  })

  return `${timestamp}${sequence}`
}
