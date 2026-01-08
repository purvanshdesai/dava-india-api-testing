import moment from 'moment'
import { MembershipModel, MembershipsData } from './memberships.schema'
import { UsersModel } from '../users/users.schema'
import { BadRequest } from '@feathersjs/errors'
import { DavaCoinsHistoryModel } from '../dava-coins-history/dava-coins-history.schema'
import { OrderModel } from '../order/order.schema'
import { OrderItemModel } from '../order-items/order-items.schema'
import { membershipConfig } from './memberships.shared'
import { MembershipOrderModel } from '../membership-orders/membership-orders.schema'
import { PAYMENT_GATEWAYS } from '../../payments'

export const issueDavaOneMembership = async (order: any) => {
  try {
    const details = {
      user: order?.user,
      membershipOrder: order?.membershipOrder,
      status: 'active',
      freeDeliveryBalance: membershipConfig.FREE_DELIVERY_COUNT,
      durationInMonths: 6, // 6 Months
      expiryOn: moment().add(6, 'months').format(),
      createdAt: moment().toISOString(),
      updatedAt: moment().toISOString()
    }

    const user = await UsersModel.findById(order.user).lean()

    if (!user) throw new BadRequest('User not found while issue davaone membership')

    const existingMembership = await MembershipModel.findOne({ user: order?.user }).lean()

    let membership: MembershipsData | any

    membership = existingMembership
      ? await MembershipModel.updateOne({ _id: existingMembership?._id }, details)
      : await MembershipModel.create(details)

    await UsersModel.updateOne(
      { _id: membership?.user },
      {
        hasDavaoneMembership: true,
        davaoneMembership: membership?._id,
        davaCoinsBalance: user?.davaCoinsBalance ?? 0
      }
    )

    // TODO: Send Email Notification
  } catch (e) {
    throw e
  }
}

export const handleExpiredMemberships = async () => {
  try {
    const now = moment().toDate()

    // Fetch all active memberships
    const activeMemberships = await MembershipModel.find({ status: 'active' }).lean()
    console.log('🚀 ~ handleExpiredMemberships ~ total activeMemberships:', activeMemberships?.length)

    for (const membership of activeMemberships) {
      if (moment(membership.expiryOn).isBefore(now)) {
        await MembershipModel.updateOne({ _id: membership._id }, { status: 'expired', updatedAt: now })
        await UsersModel.updateOne({ _id: membership.user }, { hasDavaoneMembership: false })

        console.log(`✅ Membership expired for user ${membership.user}`)
      }
    }

    console.log('🎯 Membership expiry check completed.')
  } catch (error) {
    console.error('❌ Error expiring memberships:', error)
  }
}

export const removeDavaoneMembership = async (membership: MembershipsData | any) => {
  const updatedMembership = await MembershipModel.findByIdAndUpdate(membership._id, {
    status: 'expired'
  }).lean()

  await UsersModel.updateOne(
    { _id: updatedMembership?.user },
    { hasDavaoneMembership: false, davaoneMembership: membership?._id }
  )
}

export const handleDavaCoinsPostDelivered = async (order: any) => {
  const user = await UsersModel.findById(order?.userId).lean()

  // Skip if user applied davacoins without membership
  if (!user?.davaoneMembership) return

  const membership = await MembershipModel.findById(user?.davaoneMembership).lean()
  if (!membership || membership.status !== 'active') return

  // check order amount

  const items: any[] = await OrderItemModel.find({
    order: order?._id,
    $and: [
      { $or: [{ isCancelRequested: { $exists: false } }, { isCancelRequested: false }] },
      { $or: [{ isReturnRequested: { $exists: false } }, { isReturnRequested: false }] },
      { $or: [{ isPartialCancelRequested: { $exists: false } }, { isPartialCancelRequested: false }] },
      { $or: [{ isPartialReturnRequested: { $exists: false } }, { isPartialReturnRequested: false }] }
    ]
  }).lean()

  // 1. calculate current order total and provide dava coins
  const subTotal = items.reduce((acc, it) => acc + it.amount * it.quantity, 0)
  const orderTotal = subTotal

  // const orderTotal =
  //   subTotal +
  //   order.deliveryCharge +
  //   order.handlingCharge +
  //   order.packingCharge +
  //   order.platformFee -
  //   (order.discountedAmount ?? 0) -
  //   (order.davaCoinsUsed ?? 0)

  let percentage = 0

  // decide the percentage to credit
  if (orderTotal >= 0 && orderTotal <= 499) {
    percentage = 5
  } else if (orderTotal >= 500 && orderTotal <= 999) {
    percentage = 10
  } else if (orderTotal >= 1000) {
    percentage = 20
  }

  const davaCoins = Math.floor((orderTotal * percentage) / 100)

  // Add to order object
  await OrderModel.updateOne({ _id: order?._id }, { davaCoinsCreditedForMembership: davaCoins })

  // Credit dava coins to user
  await UsersModel.updateOne({ _id: user?._id }, { $inc: { davaCoinsBalance: davaCoins } })

  await DavaCoinsHistoryModel.create({
    user: user?._id,
    orderId: order?.orderId,
    coins: davaCoins,
    usageType: 'credit',
    description: `${davaCoins} dava coins (${percentage}%) credited for ordered amount of ${Number(orderTotal).toFixed(2)}`,
    createdAt: moment().toISOString(),
    updatedAt: moment().toISOString()
  })
}

export const handleDebitDavaCoinsOnSuccessfulPayment = async (order: any) => {
  if (order?.isDavaCoinsApplied && (order?.davaCoinsUsed ?? 0) > 0) {
    const user = await UsersModel.findById(order?.userId).lean()

    // Debit dava coins from user
    await UsersModel.updateOne(
      { _id: user?._id },
      { $inc: { davaCoinsBalance: -(order.davaCoinsUsed ?? 0) } }
    )

    await DavaCoinsHistoryModel.create({
      user: user?._id,
      orderId: order?.orderId,
      coins: order.davaCoinsUsed,
      usageType: 'debit',
      description: `${order.davaCoinsUsed} dava coins applied for order #${order.orderId}`,
      createdAt: moment().toISOString(),
      updatedAt: moment().toISOString()
    })
  }
}

export const handleMembershipSubscriptionFromOrder = async (order: any) => {
  try {
    // Create membership order
    const payload = {
      user: order?.userId,
      status: 'pending',
      paymentGateway: PAYMENT_GATEWAYS.PAYU,
      paymentAmount: membershipConfig.membershipAmount,
      deviceType: order?.deviceType ?? 'web',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const mOrder = (await MembershipOrderModel.create(payload)).toObject()

    // call issueDavaOneMembership
    await issueDavaOneMembership(mOrder)
  } catch (e) {
    console.log(e)
  }
}
