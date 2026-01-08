// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Id, Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'
import moment from 'moment'

import type { Application } from '../../declarations'
import {
  CouponsModel,
  type Coupons,
  type CouponsData,
  type CouponsPatch,
  type CouponsQuery
} from './coupons.schema'
import { BadRequest, NotFound } from '@feathersjs/errors'
import { CouponUsagesModel } from '../coupon-usages/coupon-usages.schema'
import { OrderModel } from '../order/order.schema'
import { cartModel } from '../carts/carts.schema'
import { DeliveryPoliciesModel } from '../delivery-policies/delivery-policies.schema'
import { ProductsModel } from '../super-admin/products/products.schema'

export type { Coupons, CouponsData, CouponsPatch, CouponsQuery }

export interface CouponsParams extends MongoDBAdapterParams<CouponsQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class CouponsService<ServiceParams extends Params = CouponsParams> extends MongoDBService<
  Coupons,
  CouponsData,
  CouponsParams,
  CouponsPatch
> {
  async find(params?: CouponsParams): Promise<any> {
    try {
      const query: any = params?.query || {}

      // Extract pagination parameters
      const limit = parseInt(query.$limit) || 10 // Default limit to 10
      const skip = parseInt(query.$skip) || 0 // Default skip to 0

      // Find coupons based on the query with pagination
      const coupons = await CouponsModel.find({
        ...query.query,
        archive: false
      })
        .populate('products')
        .populate('collections')
        .limit(limit) // Apply limit for pagination
        .skip(skip) // Apply skip for pagination
        .lean()

      // Count total number of matching documents for pagination info
      const total = await CouponsModel.countDocuments({ ...query.query, archive: false })

      // Return the result with pagination data
      return {
        data: coupons,
        total,
        limit,
        skip
      }
    } catch (error) {
      throw error
    }
  }

  async create(data: any, params?: CouponsParams): Promise<any> {
    try {
      const { query, user }: any = params || {}
      const { startDate, expiryDate, couponCode } = data

      const now = new Date()
      // Create a new date representing today, at midnight
      const today = new Date(now.setHours(0, 0, 0, 0))

      // Subtract one day from today
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      // check if the startdate and expiry date are not in past
      if (startDate !== null && expiryDate !== null) {
        if (new Date(startDate) < yesterday || new Date(expiryDate) < yesterday) {
          throw new Error('Start date and expiry date cannot be in the past')
        }
      }

      // alpha numeric validation check
      const alphanumericRegex = /^[a-zA-Z0-9]+$/
      if (!alphanumericRegex.test(couponCode)) {
        throw new Error('Coupon code must be alphanumeric')
      }

      // check if the coupon code already exists
      const existingCoupons = await CouponsModel.find({ couponCode: couponCode }).lean()
      const isCouponCodeExists = existingCoupons.some(
        (coupon) => coupon.couponCode.toLowerCase() === couponCode.toLowerCase()
      )
      if (isCouponCodeExists) throw new Error('Coupon code already exists')

      const validateData = { ...data, createdBy: user?._id }
      const coupon = await super.create(validateData)
      return coupon
    } catch (error) {
      throw error
    }
  }

  async get(id: any): Promise<any> {
    try {
      const coupon = await CouponsModel.findById(id).lean()
      if (!coupon) {
        throw new BadRequest('Category not found')
      }

      return coupon
    } catch (error) {
      throw error
    }
  }

  async patch(id: any, data: any, params: any): Promise<any> {
    try {
      const couponExist = await CouponsModel.findById(id).lean()
      if (!couponExist) {
        throw new BadRequest('Coupon not found')
      }

      const existingCoupon = await CouponsModel.find({
        couponCode: couponExist.couponCode,
        _id: { $ne: id },
        archive: false
      }).lean()
      if (existingCoupon.length > 0) throw new Error('Coupon code already exists')

      const updatedCoupon = await CouponsModel.findByIdAndUpdate(id, { ...data })

      return updatedCoupon
    } catch (error) {
      throw error
    }
  }

  // Delete (soft delete) method that sets archive field to true
  async remove(id: any): Promise<any> {
    try {
      const updatedCoupon = await CouponsModel.findByIdAndUpdate(id, { $set: { archive: true } })
      if (!updatedCoupon) {
        throw new NotFound('Coupon not found')
      }
      return updatedCoupon
    } catch (error) {
      throw error
    }
  }
}

export class ApplyCouponService<ServiceParams extends Params = CouponsParams> extends MongoDBService<
  Coupons,
  CouponsData,
  CouponsParams,
  CouponsPatch
> {
  // New create method for POST requests (handles large item arrays in request body)
  async create(data: any, params?: CouponsParams): Promise<any> {
    const { couponCode, channel, totalAmount, zipCode, items: rawItems }: any = data || {}

    let items: any[] = []
    let enrichedItems: any = []

    if (!couponCode || !channel) throw new Error('couponCode and channel are required')

    const coupon = await CouponsModel.findOne({
      couponCode: { $regex: new RegExp(`^${couponCode}$`, 'i') },
      $or: [{ channels: { $in: [channel] } }, { channels: 'both' }],
      archive: false
    }).lean()

    if (!coupon) throw new Error('No coupon found matching the criteria')

    if (coupon?.products?.length || coupon?.collections?.length) {
      items = Array.isArray(rawItems) ? rawItems : []

      const productIds = items?.map((item: any) => item.productId).filter(Boolean)

      const productMap = await ProductsModel.find({ _id: { $in: productIds } })
        .select('_id collections')
        .lean()

      // Map productId to actual product
      enrichedItems = items?.map((item: any) => {
        const product = productMap.find((p) => p._id.toString() === item.productId.toString())

        return {
          ...item,
          productId: product || item.productId // Replace ObjectId with full product object
        }
      })
    }

    return await this.verifyCouponLogic(coupon, enrichedItems, totalAmount, zipCode, params)
  }

  async find(params?: CouponsParams | any): Promise<any> {
    const { couponCode, channel, totalAmount, zipCode, items: rawItems }: any = params?.query || {}

    let items: any[] = []
    let enrichedItems: any = []

    if (!couponCode || !channel) throw new Error('couponCode and channel are required')

    const coupon = await CouponsModel.findOne({
      couponCode: { $regex: new RegExp(`^${couponCode}$`, 'i') },
      $or: [{ channels: { $in: [channel] } }, { channels: 'both' }],
      archive: false
    }).lean()

    if (!coupon) throw new Error('No coupon found matching the criteria')

    if (coupon?.products?.length || coupon?.collections?.length) {
      items = typeof rawItems === 'string' ? JSON.parse(rawItems) : rawItems

      const productIds = items?.map((item: any) => item.productId).filter(Boolean)

      const productMap = await ProductsModel.find({ _id: { $in: productIds } })
        .select('_id collections')
        .lean()

      // Map productId to actual product
      enrichedItems = items?.map((item: any) => {
        const product = productMap.find((p) => p._id.toString() === item.productId.toString())

        return {
          ...item,
          productId: product || item.productId // Replace ObjectId with full product object
        }
      })
    }

    return await this.verifyCouponLogic(coupon, enrichedItems, totalAmount, zipCode, params)
  }

  // Extracted coupon verification logic to avoid duplication
  private async verifyCouponLogic(
    coupon: any,
    enrichedItems: any[],
    totalAmount: number,
    zipCode: string,
    params?: CouponsParams | any
  ): Promise<any> {
    const currentDate = moment()
    const startDate = moment(coupon.startDate)
    const expiryDate = moment(coupon.expiryDate)

    // 1. Check if the coupon is active
    if (!coupon?.active) throw new Error('Coupon is no longer active.')

    // 2. Check if the coupon is not archived
    if (coupon.archive) throw new Error('Coupon no longer exists.')

    // 3. Check if the current date is between startDate and expiry date
    if (currentDate.isBefore(startDate, 'day') || currentDate.isAfter(expiryDate, 'day'))
      throw new Error('Coupon has expired.')

    if (coupon?.customUsageLimit) {
      const couponUsage: any = await CouponUsagesModel.find({
        customerId: params?.user?._id,
        couponId: coupon?._id
      })

      if (couponUsage?.length >= coupon?.usageLimit) throw new Error('Coupon has been already used.')
    }

    // 4.check if the usageLimit is oneTime or unlimited and if  it is oneTime need to check from the coupon-usage db whether it's already exist or not
    if (coupon?.usageLimit == 'oneTime') {
      const couponUsage = await CouponUsagesModel.find({
        customerId: params?.user?._id,
        couponId: coupon?._id
      })

      if (couponUsage?.length) throw new Error('Coupon has been already used.')
    }

    // Calculate eligible products total if coupon has product/collection restrictions
    let eligibleTotal = totalAmount
    if (
      (Array.isArray(coupon.products) && coupon.products.length > 0) ||
      (Array.isArray(coupon.collections) && coupon.collections.length > 0)
    ) {
      eligibleTotal = 0

      if (Array.isArray(enrichedItems) && enrichedItems.length > 0) {
        // Get all product details with prices
        const productIds = enrichedItems
          .map((item: any) => item.productId?._id || item.productId)
          .filter(Boolean)
        const products = await ProductsModel.find({ _id: { $in: productIds } })
          .select('_id finalPrice collections')
          .lean()

        const productMap = new Map()
        products.forEach((p: any) => {
          productMap.set(p._id.toString(), p)
        })

        // Calculate total of only eligible products
        for (const item of enrichedItems) {
          if (!item.isSelected) continue

          const productId = item.productId?._id?.toString() || item.productId?.toString()
          const product = productMap.get(productId)

          if (!product) continue

          const productCollections = Array.isArray(item.productId?.collections)
            ? item.productId.collections.map((c: any) => c.toString())
            : []

          const isProductEligible = coupon.products?.some((id: any) => id.toString() === productId)
          const isCollectionEligible = coupon.collections?.some((collectionId: any) =>
            productCollections.includes(collectionId.toString())
          )

          if (isProductEligible || isCollectionEligible) {
            eligibleTotal += product.finalPrice * (item.quantity || 1)
          }
        }
      }
    }

    //  5.check if the item amount is greater than minimum purchase value
    if (coupon?.minimumPurchaseValue !== undefined && coupon.minimumPurchaseValue > eligibleTotal)
      throw new Error(`Total amount must be greater than ${coupon.minimumPurchaseValue}.`)

    //  6.check the discount type is percentage or fixedAmount, if fixedAmount we can directly use the discountValue else need to calculate the items's amount with percentage
    let discountValue = coupon.discountValue

    if (coupon.discountType === 'percentage') {
      const discount = (eligibleTotal * coupon.discountValue) / 100
      if (coupon?.maximumDiscountValue !== undefined && discount > coupon?.maximumDiscountValue) {
        discountValue = Math.min(discount, coupon?.maximumDiscountValue)
      } else {
        discountValue = discount
      }
    } else if (coupon.discountType === 'fixedAmount') {
      discountValue = coupon.discountValue
    }

    // // 7. If the coupon is allowed to certain emails, check if the user's email is in the allowed list
    if (
      (Array.isArray(coupon?.forEmails) && coupon.forEmails.length > 0) ||
      (Array.isArray(coupon?.forPhoneNos) && coupon.forPhoneNos.length > 0)
    ) {
      const userEmail: any = params?.user?.email
      const rawUserPhone = params?.user?.phoneNumber || ''
      const userPhoneNumber = rawUserPhone.slice(-10) // Assuming phone numbers are stored with country code

      const isEmailAllowed = Array.isArray(coupon.forEmails) && coupon.forEmails.includes(userEmail)

      const isPhoneAllowed = Array.isArray(coupon.forPhoneNos) && coupon.forPhoneNos.includes(userPhoneNumber)

      if (!isEmailAllowed && !isPhoneAllowed) {
        throw new Error("This coupon doesn't apply to the current User.")
      }
    }
    // checking whether coupon supports the current zipcode
    if (coupon.deliveryPolicies?.length && zipCode) {
      const deliveryPolicies = await DeliveryPoliciesModel.find({
        _id: { $in: coupon.deliveryPolicies }
      }).lean()

      const pincodeAllowed = deliveryPolicies.some((policy) => policy.postalCodes?.includes(zipCode))

      if (!pincodeAllowed) throw new Error('This coupon is not activated for the current location.')
    }

    // checking if any of the product or product's collection is applicable for the coupon
    let isAnyConditionMatched = false

    if (Array.isArray(coupon.products) && coupon.products.length > 0 && Array.isArray(enrichedItems)) {
      const cartProductIds = enrichedItems
        ?.map((item: any) => item.productId?._id?.toString())
        .filter(Boolean)

      const productAllowed = coupon.products.some((productId: any) =>
        cartProductIds.includes(productId.toString())
      )

      if (productAllowed) isAnyConditionMatched = true
    }

    if (Array.isArray(coupon.collections) && coupon.collections.length > 0 && Array.isArray(enrichedItems)) {
      const cartCollectionIds = enrichedItems
        ?.flatMap((item: any) =>
          Array.isArray(item.productId?.collections)
            ? item.productId.collections.map((c: any) => c.toString())
            : []
        )
        .filter(Boolean)

      const collectionAllowed = coupon.collections.some((collectionId: any) =>
        cartCollectionIds.includes(collectionId.toString())
      )

      if (collectionAllowed) isAnyConditionMatched = true
    }

    if (
      (Array.isArray(coupon.products) && coupon.products.length > 0) ||
      (Array.isArray(coupon.collections) && coupon.collections.length > 0)
    ) {
      if (!isAnyConditionMatched) throw new Error('This coupon is not activated for the current product!')
    }

    // User eligibility filtering based on forUserType
    const hasPaidOrder = await OrderModel.exists({ userId: params?.user?._id, status: 'paid' })
    if (coupon.forUserType === 'firstTimeUser' && hasPaidOrder)
      throw new Error('Coupon is only for first time users.')
    if (coupon.forUserType === 'repeatedUser' && !hasPaidOrder)
      throw new Error('Coupon is only for repeated users.')
    // 'common' means no filter needed

    return {
      _id: coupon._id,
      couponName: coupon.couponName,
      couponCode: coupon.couponCode,
      discountValue,
      description: coupon.description,
      products: coupon?.products,
      collections: coupon?.collections
    }
  }
}

export class ConsumerCouponsService<ServiceParams extends Params = CouponsParams> extends MongoDBService<
  Coupons,
  CouponsData,
  CouponsParams,
  CouponsPatch
> {
  async find(params?: CouponsParams): Promise<any> {
    try {
      const { channel, totalAmount, email, phoneNumber, isNewCode }: any = params?.query || {}

      const cart: any = await cartModel
        .findOne({ userId: params?.user?._id })
        .populate({
          path: 'items.productId',
          select: '_id collections finalPrice'
        })
        .lean()
      const cartPincode: string = cart?.zipCode

      const currentDate = new Date(new Date().toISOString())

      const coupons = await CouponsModel.find({
        $and: [
          {
            $or: [{ channels: { $in: [channel] } }, { channels: 'both' }]
          },
          { active: true },
          { archive: false },
          {
            $or: [{ isOfflineCoupon: false }, { isOfflineCoupon: { $exists: false } }]
          }
        ]
      }).lean()

      const hasPaidOrder = await OrderModel.exists({ userId: params?.user?._id, status: 'paid' })

      const normalizePhone = (phone: string | undefined | null) => {
        if (!phone) return '' // Return empty string if undefined/null
        return phone.replace(/\D/g, '').slice(-10)
      } // Remove non-numeric characters & take last 10 digits

      const normalizedPhoneNumber = phoneNumber ? normalizePhone(phoneNumber) : ''

      const careCoupon = coupons.find((c: any) => c.couponCode?.toLowerCase() === 'carestart')

      const careEligible = await this.checkSpecialCouponEligibilityByCustomer(
        totalAmount,
        params?.user?._id,
        careCoupon
      )

      // ⚡ PERFORMANCE OPTIMIZATION: Fetch product prices ONCE before the loop
      let productPriceMap = new Map<string, { finalPrice: number; collections: string[] }>()
      
      if (Array.isArray(cart?.items) && cart.items.length > 0) {
        // Check if we need to fetch prices
        const needsFetch = cart.items.some(
          (item: any) => !item.productId?.finalPrice && item.productId?._id
        )

        if (needsFetch) {
          const cartProductIds = cart.items
            .map((item: any) => item.productId?._id || item.productId)
            .filter(Boolean)

          const products = await ProductsModel.find({ _id: { $in: cartProductIds } })
            .select('_id finalPrice collections')
            .lean()

          products.forEach((p: any) => {
            productPriceMap.set(p._id.toString(), {
              finalPrice: p.finalPrice,
              collections: p.collections || []
            })
          })
        } else {
          // Use populated data
          cart.items.forEach((item: any) => {
            if (item.productId?._id && item.productId?.finalPrice) {
              productPriceMap.set(item.productId._id.toString(), {
                finalPrice: item.productId.finalPrice,
                collections: item.productId.collections || []
              })
            }
          })
        }
      }

      // Helper function to calculate eligible amount for a coupon
      const calculateEligibleAmount = (coupon: any): number => {
        // If no product/collection restrictions, entire cart is eligible
        if (
          (!Array.isArray(coupon.products) || coupon.products.length === 0) &&
          (!Array.isArray(coupon.collections) || coupon.collections.length === 0)
        ) {
          return totalAmount
        }

        // Calculate eligible amount for restricted coupons
        let eligibleAmount = 0

        if (Array.isArray(cart?.items) && cart.items.length > 0) {
          for (const item of cart.items) {
            if (!item.isSelected) continue

            const productId = item.productId?._id?.toString() || item.productId?.toString()
            const product = productPriceMap.get(productId)

            if (!product) continue

            const productCollections = Array.isArray(item.productId?.collections)
              ? item.productId.collections.map((c: any) => c.toString())
              : product.collections.map((c: any) => c.toString())

            const isProductEligible = coupon.products?.some((id: any) => id.toString() === productId)
            const isCollectionEligible = coupon.collections?.some((collectionId: any) =>
              productCollections.includes(collectionId.toString())
            )

            if (isProductEligible || isCollectionEligible) {
              eligibleAmount += product.finalPrice * (item.quantity || 1)
            }
          }
        }

        return eligibleAmount
      }

      const evaluatedCoupons = await Promise.all(
        coupons.map(async (coupon: any) => {
          const expiryDate = coupon.expiryDate
          const isNotExpired = !expiryDate || new Date(expiryDate) > currentDate

          const hasEmails = Array.isArray(coupon.forEmails) && coupon.forEmails.length > 0
          const hasPhones = Array.isArray(coupon.forPhoneNos) && coupon.forPhoneNos.length > 0

          const emailMatch = hasEmails ? coupon.forEmails.includes(email) : false
          const phoneMatch = hasPhones
            ? coupon.forPhoneNos.some((p: string) => normalizePhone(p) === normalizedPhoneNumber)
            : false

          const isValid = (hasEmails && emailMatch) || (hasPhones && phoneMatch)

          // usage limit wise coupon filtering
          if (coupon?.customUsageLimit) {
            const couponUsage: any = await CouponUsagesModel.find({
              customerId: params?.user?._id,
              couponId: coupon?._id
            })

            if (couponUsage?.length >= coupon?.usageLimit) return null
          }

          if (coupon?.usageLimit == 'oneTime') {
            const couponUsage = await CouponUsagesModel.find({
              customerId: params?.user?._id,
              couponId: coupon?._id
            })

            if (couponUsage?.length) return null
          }

          let isAnyConditionMatched = false

          // 📍 Pincode-wise coupon filtering
          if (coupon.deliveryPolicies?.length && cartPincode) {
            const deliveryPolicies = await DeliveryPoliciesModel.find({
              _id: { $in: coupon.deliveryPolicies }
            }).lean()

            const pincodeAllowed = deliveryPolicies.some((policy) =>
              policy.postalCodes?.includes(cartPincode)
            )

            if (!pincodeAllowed) return null
          }

          // 📍 Product-wise coupon filtering
          if (Array.isArray(coupon.products) && coupon.products.length > 0 && Array.isArray(cart?.items)) {
            const cartProductIds = cart.items
              .map((item: any) => item.productId?._id?.toString())
              .filter(Boolean)

            const productAllowed = coupon.products.some((productId: any) =>
              cartProductIds.includes(productId.toString())
            )

            if (productAllowed) isAnyConditionMatched = true
          }

          // 📍 Collection-wise coupon filtering
          if (
            Array.isArray(coupon.collections) &&
            coupon.collections.length > 0 &&
            Array.isArray(cart?.items)
          ) {
            const cartCollectionIds = cart.items
              .flatMap((item: any) =>
                Array.isArray(item.productId?.collections)
                  ? item.productId.collections.map((c: any) => c.toString())
                  : []
              )
              .filter(Boolean)

            const collectionAllowed = coupon.collections.some((collectionId: any) =>
              cartCollectionIds.includes(collectionId.toString())
            )

            if (collectionAllowed) isAnyConditionMatched = true
          }

          if (
            (Array.isArray(coupon.products) && coupon.products.length > 0) ||
            (Array.isArray(coupon.collections) && coupon.collections.length > 0)
          ) {
            if (!isAnyConditionMatched) return null
          }

          // ⚡ Use pre-calculated eligible amount (no DB queries in loop!)
          const eligibleAmount = calculateEligibleAmount(coupon)

          const meetsMinPurchase = eligibleAmount >= (coupon.minimumPurchaseValue || 0)

          const eligible = await this.checkSpecialCouponEligibilityByCustomer(
            eligibleAmount,
            params?.user?._id,
            coupon
          )

          // User eligibility filtering based on forUserType
          if (coupon.forUserType === 'firstTimeUser' && hasPaidOrder) return null
          if (coupon.forUserType === 'repeatedUser' && !hasPaidOrder) return null
          // 'common' means no filter needed

          const eligibleCoupon = coupon.couponCode?.toLowerCase() === 'carestart' ? eligible : true

          // Calculate the actual discount value based on eligible amount
          let calculatedDiscountValue = 0
          if (coupon.discountType === 'percentage') {
            const discount = (eligibleAmount * coupon.discountValue) / 100
            if (coupon?.maximumDiscountValue !== undefined && discount > coupon?.maximumDiscountValue) {
              calculatedDiscountValue = Math.min(discount, coupon?.maximumDiscountValue)
            } else {
              calculatedDiscountValue = discount
            }
          } else if (coupon.discountType === 'fixedAmount') {
            calculatedDiscountValue = coupon.discountValue
          }

          const isEligible =
            isNotExpired && meetsMinPurchase && eligibleCoupon && (hasEmails || hasPhones ? isValid : true)

          if (!isEligible) return null

          // Transform coupon data for frontend consumption
          // If coupon has product/collection restrictions, override discountValue with calculated amount
          // This way existing frontend code automatically picks up the correct value
          const hasRestrictions =
            (Array.isArray(coupon.products) && coupon.products.length > 0) ||
            (Array.isArray(coupon.collections) && coupon.collections.length > 0)

          if (hasRestrictions) {
            return {
              ...coupon,
              originalDiscountValue: coupon.discountValue, // Store original for reference
              originalDiscountType: coupon.discountType, // Store original type
              discountValue: calculatedDiscountValue, // Override with calculated amount
              discountType: 'fixedAmount', // Change to fixedAmount so frontend uses it directly
              eligibleAmount, // Include eligible amount for reference
              calculatedDiscountValue // Keep this too for backward compatibility
            }
          } else {
            // No restrictions - return as is
            return {
              ...coupon,
              eligibleAmount,
              calculatedDiscountValue
            }
          }
        })
      )
      const availableCoupons = evaluatedCoupons.filter(Boolean)

      if (availableCoupons.length > 0) {
        return availableCoupons
      }

      // 🔁 Fallback: suggest closest coupon above totalAmount
      const fallbackCouponCandidates = await Promise.all(
        coupons.map(async (coupon: any) => {
          const expiryDate = coupon.expiryDate
          const isNotExpired = !expiryDate || new Date(expiryDate) > currentDate

          const meetsEligibility = coupon.active && !coupon.archive && isNotExpired

          const noFilters =
            (!coupon?.products || coupon.products.length === 0) &&
            (!coupon?.collections || coupon.collections.length === 0) &&
            (!coupon?.deliveryPolicies || coupon.deliveryPolicies.length === 0) &&
            (!coupon?.forEmails || coupon.forEmails.length === 0) &&
            (!coupon?.forPhoneNos || coupon.forPhoneNos.length === 0)

          // Check usage limit for oneTime coupons
          if (coupon?.usageLimit == 'oneTime') {
            const couponUsage = await CouponUsagesModel.find({
              customerId: params?.user?._id,
              couponId: coupon?._id
            })

            if (couponUsage?.length) return null
          }

          // Check custom usage limit
          if (coupon?.customUsageLimit) {
            const couponUsage: any = await CouponUsagesModel.find({
              customerId: params?.user?._id,
              couponId: coupon?._id
            })

            if (couponUsage?.length >= coupon?.usageLimit) return null
          }

          // User eligibility filtering based on forUserType
          if (coupon.forUserType === 'firstTimeUser' && hasPaidOrder) return null
          if (coupon.forUserType === 'repeatedUser' && !hasPaidOrder) return null

          // Check special coupon eligibility (like CARESTART)
          const eligible = await this.checkSpecialCouponEligibilityByCustomer(
            totalAmount,
            params?.user?._id,
            coupon
          )
          const eligibleCoupon = coupon.couponCode?.toLowerCase() === 'carestart' ? eligible : true

          if (!eligibleCoupon) return null

          return meetsEligibility &&
            coupon.minimumPurchaseValue &&
            totalAmount < coupon.minimumPurchaseValue &&
            noFilters
            ? coupon
            : null
        })
      )

      const fallbackCoupon: any = fallbackCouponCandidates
        .filter(Boolean)
        .sort((a: any, b: any) => a.minimumPurchaseValue - b.minimumPurchaseValue)
        .find(() => true)

      if (fallbackCoupon && isNewCode) {
        const diff = fallbackCoupon.minimumPurchaseValue - totalAmount
        const roundedDiff = Number.isInteger(diff) ? diff : Math.round(diff)

        return {
          message: `Add ₹${roundedDiff} more to avail the coupon ${fallbackCoupon.couponCode}!.`
        }
      }

      return []
    } catch (error) {
      throw error
    }
  }

  async checkSpecialCouponEligibilityByCustomer(
    totalAmount: number,
    customerId: any,
    coupon: any
  ): Promise<boolean> {
    // Check if the user has ever placed a paid order
    const hasPaidOrder = await OrderModel.exists({ userId: customerId, status: 'paid' })

    // User has paid order: check how many times SARATHNEW was used
    const usageCount = await CouponUsagesModel.find({
      couponId: coupon?._id,
      customerId
    })

    if (hasPaidOrder && usageCount.length == 0) return false

    if (!hasPaidOrder) {
      return totalAmount >= 399
    }

    if (usageCount.length >= 4) return false

    // For orders 2-4: ₹249 minimum
    return totalAmount >= 249
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('coupons'))
  }
}
