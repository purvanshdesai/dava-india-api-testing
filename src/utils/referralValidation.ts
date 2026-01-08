import moment from 'moment'
import { UsersModel } from '../services/users/users.schema'
import { OrderModel } from '../services/order/order.schema'
import { ReferralCreditsModal } from '../services/referral-credits/referral-credits.schema'
import { DavaCoinsHistoryModel } from '../services/dava-coins-history/dava-coins-history.schema'

/**
 * Validate and resolve a referral code to a referrer userId.
 * Handles all attribution edge cases.
 *
 * @param {Object} options
 * @param {String} options.userId - Current user's ID (if already signed up)
 * @param {String} [options.referralCode] - Referral code from URL param
 * @returns {Promise<{ valid: boolean, reason?: string, referrerUserId?: string }>}
 */
export const validateReferral = async ({
  userId,
  referralCode
}: {
  userId: string
  referralCode: string
}) => {
  if (!referralCode) {
    return { valid: false, reason: 'No referral code provided' }
  }

  // ✅ 2. Check referral code exists
  const referrer = await UsersModel.findOne({ referralCode }).lean()
  if (!referrer) {
    return { valid: false, reason: 'Invalid referral code' }
  }

  // ✅ 3. Block self-referral
  if (userId && referrer._id.equals(userId)) {
    return { valid: false, reason: 'Self-referral is not allowed' }
  }

  // ✅ 4. Check if user already attributed to a referral
  const user = await UsersModel.findById(userId).lean()
  if (user && user?.referral?.referredByUserId) {
    return { valid: false, reason: 'Referral code already used by this user' }
  }

  // // ✅ 5. Check expiration window (using moment)
  // const referrerCreatedAt = referrer.createdAt || referrer._id.getTimestamp() // fallback if no field
  // const diffDays = moment().diff(moment(referrerCreatedAt), 'days')

  // if (diffDays > REFERRAL_EXPIRY_DAYS) {
  //   return { valid: false, reason: 'Referral code expired' }
  // }

  // ✅ 6. Check if user has already placed orders (should be a new user)
  if (user) {
    const previousOrder = await OrderModel.findOne({
      userId: user._id,
      status: 'paid'
    })
    if (previousOrder) {
      return { valid: false, reason: 'Referral not valid for existing users' }
    }
  }

  // ✅ Passed all checks
  return { valid: true, referrerUserId: referrer._id }
}

// Assumes MongoDB replica set (transactions supported)
export const tryCreditReferralForOrder = async (orderId: string) => {
  try {
    const order = await OrderModel.findById(orderId).lean()
    if (!order) throw new Error('order not found')

    if (order.status !== 'paid') {
      return { credited: false, reason: 'order not completed' }
    }

    const user = await UsersModel.findById(order.userId).lean()
    if (!user || !user.referral) {
      return { credited: false, reason: 'no referral' }
    }

    // check if user already had a completed order before this one
    const priorCount = await OrderModel.countDocuments({
      userId: user._id,
      status: 'paid',
      _id: { $ne: order._id },
      createdAt: { $lt: order.createdAt }
    })

    if (priorCount > 0) {
      return { credited: false, reason: 'not first completed order' }
    }

    // Optionally: check referral window:
    const referralWindowDays = 30
    if (
      user.referral &&
      order.createdAt &&
      moment(order.createdAt).diff(moment(user?.referral?.referredAt), 'days') > referralWindowDays
    ) {
      return { credited: false, reason: 'referral expired' }
    }

    // Ensure we haven't credited before
    const existingCredit = await ReferralCreditsModal.findOne({
      referredUserId: user._id
    })

    if (existingCredit) {
      return { credited: false, reason: 'already credited' }
    }

    // create credit record (this can have a unique index to protect against races)
    const rewardAmount = 50 // coins

    await Promise.allSettled([
      ReferralCreditsModal.create({
        referrerUserId: user.referral?.referredByUserId,
        referredUserId: user._id,
        referralCode: user.referral?.code, // optional
        creditedAt: new Date(),
        rewardAmount,
        orderId: order._id,
        status: 'credited'
      }),

      // update referrer's wallet atomically
      UsersModel.updateOne(
        { _id: user.referral?.referredByUserId },
        { $inc: { davaCoinsBalance: rewardAmount } }
      ),

      DavaCoinsHistoryModel.create({
        user: user.referral?.referredByUserId,
        orderId: order?.orderId,
        coins: rewardAmount,
        usageType: 'credit',
        description: 'Refer and Earn',
        createdAt: moment().toISOString(),
        updatedAt: moment().toISOString()
      }),

      // mark user as credited (optional)
      UsersModel.updateOne({ _id: user._id }, { $set: { 'referral.referralCredited': true } })
    ])

    return { credited: true }
  } catch (err) {
    throw err
  }
}
