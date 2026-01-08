// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { PaginationOptions, Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type { Carts, CartsData, CartsPatch, CartsQuery } from './carts.schema'
import { cartModel } from './carts.schema'
import { DeliveryPoliciesModel } from '../delivery-policies/delivery-policies.schema'
import { StoreInventoryModel } from '../store-inventory/store-inventory.schema'
import { userAddressModel } from '../user-addresses/user-addresses.schema'
import { ProductsModel } from '../super-admin/products/products.schema'
import { defaultZipCode } from '../zip-codes/zip-codes.shared'
import { app } from '../../app'
import { StoreModel } from '../stores/stores.schema'
import { SettingsModel } from '../settings/settings.schema'
import { ZipCodesModel } from '../zip-codes/zip-codes.schema'
import { getStoresDistances } from '../../utils/nearestStore'
import { getStore } from '../../cachedResources/order/cache/orderCache'
import { MEMBERSHIP_STATUS, MembershipModel } from '../memberships/memberships.schema'
import { calculateProductLevelDiscount } from '../order/order.shared'
import { UsersModel } from '../users/users.schema'
import { getBatchesExpiryMoreThan90Days } from '../store-inventory/store-inventory.shared'
import { getProductTaxDetails } from '../../utils/taxCalculation'
import { getProductStockStatus } from '../super-admin/products/products.shared'
import { davaCoinsConfig } from '../../utils/config'
import { applyDavaCoinsProductLevel, getRedeemableDavaCoins } from '../../utils/davaCoins'
import { membershipConfig } from '../memberships/memberships.shared'

export type { Carts, CartsData, CartsPatch, CartsQuery }

export interface CartsParams extends MongoDBAdapterParams<CartsQuery> {}

interface PriceRange {
  priceFrom: number
  priceTo: number
  noLimit: boolean
  deliveryCharge: number
}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class CartsService<ServiceParams extends Params = CartsParams> extends MongoDBService<
  Carts,
  CartsData,
  CartsParams,
  CartsPatch
> {
  async create(data: CartsData | any, params?: ServiceParams): Promise<any> {
    try {
      const userId = params?.user?._id
      if (!userId) throw new Error('Unauthorized: missing user id')
      const items: any[] = Array.isArray(data?.items) ? data.items : []

      // Basic payload setup
      const deliveryMode = data?.deliveryMode === 'standard' ? 'standard' : 'oneDay'
      const zipCode = data?.zipCode
      const payload: any = { userId, ...data, deliveryMode }

      // Existing cart (if any)
      const existingCart = await cartModel.findOne({ userId }).lean()

      // Load user address and delivery policy (parallel)
      const [userAddress, deliveryPolicy] = await Promise.all([
        userAddressModel.findOne({ _id: data?.addressId }).lean(),
        DeliveryPoliciesModel.findOne({ postalCodes: zipCode, active: true }).lean()
      ])

      // Resolve coordinates: prefer address, then zip-code db
      let coordinates: { longitude?: number; latitude?: number } | null = null
      if (userAddress?.coordinates) {
        const { longitude, latitude } = userAddress.coordinates
        coordinates = { longitude, latitude }
      } else if (zipCode) {
        const zipCodeData: any = await ZipCodesModel.findOne({ zipCode }).lean()
        if (zipCodeData?.location?.coordinates) {
          const [longitude, latitude] = zipCodeData.location.coordinates
          coordinates = { longitude, latitude }
        }
      }

      // Get active stores (policy-aware) and then stores that have the items
      const activeStores = await this.getActiveStores(deliveryPolicy, zipCode)
      const availableStores = await this.getAvailableStore(activeStores, items)

      // Compute distances (if needed)
      const storeWithDistance = await getStoresDistances({
        userZipCode: zipCode,
        userZipLat: coordinates?.latitude ?? 0,
        userZipLon: coordinates?.longitude ?? 0,
        activeStores: availableStores,
        policyId: deliveryPolicy?._id?.toString()
      })

      // stores within 7km
      const storesWithin7km = storeWithDistance.filter(
        (s) => typeof s.distance === 'number' && s.distance <= 7000
      )

      // dMode for delivery-time info (may be undefined)
      const dMode = deliveryPolicy?.deliveryModes?.[deliveryMode]

      // Get available delivery modes early to check if current mode is available
      const availableDeliveryModes = this.getAvailableDeliveryModes(deliveryPolicy)
      const isDeliveryModeAvailable = availableDeliveryModes.some((mode: any) => mode.mode === deliveryMode)

      // Track previous delivery mode from existing cart to detect mode change
      const previousDeliveryMode = existingCart?.deliveryMode
      const isSwitchingToStandard =
        deliveryMode === 'standard' && previousDeliveryMode && previousDeliveryMode !== 'standard'

      // === Batch-fetch product docs for all items to avoid repeated DB calls ===
      const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean))]
      let productsById: Record<string, any> = {}
      if (productIds.length) {
        const products = await ProductsModel.find({ _id: { $in: productIds } })
          .select('_id taxes finalPrice unitPrice maxOrderQuantity collections')
          .populate('taxes')
          .populate('collections', '_id name')
          .lean()
        productsById = products.reduce((acc: any, p: any) => {
          acc[p._id.toString()] = p
          return acc
        }, {})
      }

      // Process each item concurrently (but keep DB calls inside resolved)
      const processedItems = await Promise.all(
        items.map(async (item: any) => {
          // defensive copy
          const it = { ...item }

          const product = productsById[it.productId?.toString()]
          if (!product) {
            // If product missing, mark not deliverable / out of stock
            it.isNotDeliverable = true
            it.isOutOfStock = true
            it.isSelected = false
            it.amount = null
            it.taxes = []
            it.taxAmount = 0
            it.note = 'Product does not exist'
            return it
          }

          // enforce maxOrderQuantity
          if (product.maxOrderQuantity && product.maxOrderQuantity < (it.quantity ?? 1)) {
            it.quantity = product.maxOrderQuantity
          }

          if (it.quantity < 1) {
            it.quantity = 1
          }

          it.amount = product.finalPrice
          it.taxes = product.taxes ?? []

          // compute tax amount if relevant
          if ((it.taxes?.length ?? 0) > 0) {
            const taxDetails = getProductTaxDetails({ ...product, quantity: Number(it.quantity ?? 1) })
            it.taxAmount = taxDetails.totalAmount ?? 0
          } else {
            it.taxAmount = 0
          }

          // if no available stores or no delivery policy -> not deliverable
          if (!availableStores.length || !deliveryPolicy) {
            it.isNotDeliverable = true
            it.isSelected = false
            it.isOutOfStock = false // we only know deliverability here
          } else {
            // Check stock & deliverability (your helper returns { isOutOfStock, isNotDeliverable })
            const stockStatus = await getProductStockStatus(
              deliveryPolicy,
              it.productId,
              Number(it.quantity ?? 1),
              zipCode
            )
            const isOutOfStock = !!stockStatus.isOutOfStock
            const isNotDeliverable = !!stockStatus.isNotDeliverable

            const disabled = isNotDeliverable || isOutOfStock
            it.isSelected = disabled ? false : Boolean(it.isSelected)
            it.isOutOfStock = isOutOfStock
            it.isNotDeliverable = isNotDeliverable

            if (!disabled) {
              it.deliveryTime = dMode?.deliveryTime ?? null
              it.timeDurationType = dMode?.timeDurationType ?? null
            }
          }

          it.note = null

          // Additional same-day (oneDay) restriction: product must exist in storesWithin7km
          if (!it.isNotDeliverable && deliveryMode === 'oneDay') {
            const inSameDayRange = storesWithin7km.some(
              (s: any) =>
                Array.isArray(s.items) &&
                s.items.map((id: any) => id.toString()).includes(product._id.toString())
            )
            if (!inSameDayRange) {
              it.isNotDeliverable = true
              it.isSelected = false
              it.note =
                'Your selected location is outside the delivery range for Same-Day delivery. Please choose a different delivery mode.'
            }
          }

          return it
        })
      )

      // Handle delivery mode availability: unselect all if mode not available
      // or select all if switching back to standard
      if (!isDeliveryModeAvailable) {
        // If delivery mode is not available, unselect all products
        processedItems.forEach((it: any) => {
          it.isSelected = false
        })
      } else if (isSwitchingToStandard) {
        // If switching back to standard and it's available, select all products that are not disabled
        processedItems.forEach((it: any) => {
          if (!it.isOutOfStock && !it.isNotDeliverable) {
            it.isSelected = true
          }
        })
      }

      payload.items = processedItems

      // Totals & delivery charges
      const totalCartPrice = await this.totalCartPrice(payload.items)
      const { applicableDeliveryCharge, freeMinOrderValue } = this.getApplicableRange(
        totalCartPrice,
        dMode?.priceRange ?? []
      )

      payload.deliveryCharges = applicableDeliveryCharge ?? 0
      payload.deliveryChargeWaiver = 0
      payload.discountAmount = 0
      payload.freeMinOrderValue = freeMinOrderValue ?? 0

      payload.taxAmount = payload.items.reduce((acc: number, it: any) => {
        if (it.isSelected) return acc + (Number(it.taxAmount ?? 0) || 0)
        return acc
      }, 0)

      // Apply discount/coins/other adjustments (these may mutate payload)
      await this.applyCouponDiscount(payload, totalCartPrice, params)
      await this.applyDavaCoins(userId, payload, totalCartPrice)

      // apply dava coins product level if applied
      if (payload?.davaCoinsUsed && payload?.davaCoinsUsed > 0) {
        applyDavaCoinsProductLevel(payload?.items, payload?.davaCoinsUsed)
      }

      await this.assignAdditionalCharges(payload)
      await this.checkMembershipBenefit(params?.user, payload, totalCartPrice)
      await this.applyDavaOneMembershipAmount(payload)

      // Save or update cart
      let cartData
      if (existingCart) {
        cartData = await cartModel
          .findByIdAndUpdate(existingCart._id, payload, { returnDocument: 'after' })
          .lean()
      } else {
        cartData = await super.create(payload, params)
      }

      return { ...cartData, availableDeliveryModes }
    } catch (err: any) {
      // Add context for easier debugging, but rethrow the underlying error
      const message = `Error creating cart: ${err?.message ?? err}`
      // optional: console.error(message, { err })
      throw Object.assign(new Error(message), { originalError: err })
    }
  }

  async getActiveStores(deliveryPolicy: any, zipCode: any) {
    // gagan redis
    const stores = await StoreModel.find({
      _id: { $in: deliveryPolicy?.stores },
      active: true,
      $or: [{ deleted: { $exists: false } }, { deleted: false }],
      serviceableZip: { $in: parseInt(zipCode?.zipCode ? zipCode?.zipCode : zipCode) }
    }).lean()

    await getStore(deliveryPolicy?._id.toString(), stores)
    return stores
  }

  async getAvailableStore(stores: any, items: any) {
    const productStock = await StoreInventoryModel.aggregate([
      {
        $match: {
          storeId: { $in: stores.map((s: any) => s._id) },
          productId: { $in: items.map((i: any) => i.productId) },
          stock: { $gt: 0 },
          $expr: {
            $gte: [
              {
                $subtract: [
                  {
                    $subtract: [
                      '$stock',
                      { $ifNull: ['$softHoldCount', 0] } // First subtraction
                    ]
                  },
                  { $ifNull: ['$softHoldForOrderCount', 0] } // Second subtraction
                ]
              }, // Result of the subtraction
              0 // Ensure stock is greater than 0
            ]
          }
        }
      },
      {
        $group: {
          _id: '$storeId', // Group by storeId
          items: { $addToSet: '$productId' } // Collect product IDs for each store
        }
      },
      {
        $project: {
          _id: 0,
          storeId: '$_id',
          items: 1 // Renaming products to items
        }
      }
    ])
    const availableProductIds = new Set(
      productStock.flatMap((store: any) => store.items.map((id: any) => id.toString()))
    )

    // Mark out-of-stock items
    items.forEach((item: any) => {
      if (!availableProductIds.has(item.productId.toString())) {
        item.isOutOfStock = true
      }
    })

    return productStock.length ? productStock : []
  }

  async applyCouponDiscount(payload: any, totalCartPrice: any, params: any) {
    if (!payload?.couponCode) {
      payload?.items.forEach((i: any) => {
        i.discountAmount = 0
      })
      return
    }

    try {
      // Use create method (POST) to avoid issues with large item arrays
      const updatedDiscount = await app.service('apply-coupon').create(
        {
          couponCode: payload?.couponCode,
          channel: 'webApp',
          totalAmount: totalCartPrice,
          items: payload?.items
        },
        { user: params?.user }
      )
      const discountAmount = updatedDiscount?.discountValue || 0

      payload.discountAmount = discountAmount

      if (discountAmount && discountAmount > 0)
        await calculateProductLevelDiscount(payload.items, totalCartPrice, discountAmount, updatedDiscount)
    } catch {
      payload.couponCode = null
      payload.discountAmount = 0
    }
  }

  async applyDavaCoins(userId: any, payload: any, totalCartPrice: number) {
    if (!payload?.isDavaCoinsApplied) payload.davaCoinsUsed = 0
    else if (payload?.isDavaCoinsApplied && totalCartPrice < davaCoinsConfig.minimumOrderValue) {
      payload.davaCoinsUsed = 0
      payload.isDavaCoinsApplied = false
    } else if (payload?.isDavaCoinsApplied) {
      const user = await UsersModel.findById(userId).select('davaCoinsBalance').lean()
      const coins = getRedeemableDavaCoins(totalCartPrice, user?.davaCoinsBalance ?? 0)

      if (coins > 0) payload.davaCoinsUsed = coins
      else {
        payload.davaCoinsUsed = 0
        payload.isDavaCoinsApplied = false
      }
    }
  }

  async assignAdditionalCharges(payload: any) {
    const charges = ['handlingCharge', 'packingCharge', 'platformFee']
    const generalSettings = await SettingsModel.find({
      settingCategory: 'general',
      settingType: { $in: charges }
    }).lean()

    let handlingCharge = 0
    let packingCharge = 0
    let platformFee = 0
    let handlingChargeApplicable = false
    let packingChargeApplicable = false
    let platformFeeApplicable = false

    for (const setting of generalSettings) {
      const { settingType, value } = setting
      if (settingType === 'handlingCharge') {
        handlingChargeApplicable = value.applicable ?? false
        handlingCharge = value[settingType] || 0
      }
      if (settingType === 'packingCharge') {
        packingChargeApplicable = value.applicable ?? false
        packingCharge = value[settingType] || 0
      }
      if (settingType === 'platformFee') {
        platformFeeApplicable = value.applicable ?? false
        platformFee = value[settingType] || 0
      }
    }

    payload.handlingChargeApplicable = handlingChargeApplicable
    payload.handlingCharge = handlingCharge
    payload.packagingChargeApplicable = packingChargeApplicable
    payload.packagingCharge = packingCharge
    payload.platformFeeApplicable = platformFeeApplicable
    payload.platformFee = platformFee
  }

  async applyDavaOneMembershipAmount(payload: CartsData) {
    payload.davaOneMembershipAmount = payload?.isDavaOneMembershipAdded
      ? membershipConfig.membershipAmount
      : 0
  }

  getAvailableDeliveryModes(deliveryPolicy: any) {
    const modes = []
    if (deliveryPolicy?.isOneDayDeliveryAvailable)
      modes.push({ ...deliveryPolicy?.deliveryModes.oneDay, mode: 'oneDay' })
    if (deliveryPolicy?.isStandardDeliveryAvailable)
      modes.push({ ...deliveryPolicy?.deliveryModes.standard, mode: 'standard' })

    return modes
  }

  getApplicableRange(totalPrice: number, priceRanges: PriceRange[]): any {
    let applicableRange, freeDeliveryRange
    for (const range of priceRanges) {
      if (totalPrice >= range.priceFrom && totalPrice < range.priceTo) applicableRange = range
      if (range.noLimit) freeDeliveryRange = range
    }
    return {
      applicableRange,
      applicableDeliveryCharge: applicableRange?.deliveryCharge ?? 0,
      freeMinOrderValue: freeDeliveryRange?.priceFrom ?? 0
    }
  }

  async checkMembershipBenefit(user: any, payload: any, totalCartPrice: number) {
    if (!user?.hasDavaoneMembership || payload.deliveryCharges === 0) {
      payload.hasMembershipFreeDeliveryBenefit = false
      return
    }

    const membership = await MembershipModel.findOne({
      _id: user?.davaoneMembership,
      status: MEMBERSHIP_STATUS.ACTIVE
    })
      .select('_id freeDeliveryBalance')
      .lean()

    if (
      membership?.freeDeliveryBalance &&
      membership?.freeDeliveryBalance > 0 &&
      totalCartPrice > membershipConfig.FREE_DELIVERY_PRICE
    ) {
      payload.deliveryChargeWaiver = payload.deliveryCharges
      payload.deliveryCharges = 0
      payload.hasMembershipFreeDeliveryBenefit = true
    } else {
      payload.hasMembershipFreeDeliveryBenefit = false
    }
  }

  async find(params?: (CartsParams & { paginate?: PaginationOptions }) | undefined | any): Promise<any> {
    const userId = params?.user?._id

    await cartModel.updateOne({ userId }, { deliveryMode: 'standard' })

    const cart: any = await cartModel.findOne({ userId }).lean()

    if (!cart) return {}

    let zipCode: any = defaultZipCode

    const addresses = await userAddressModel.find({ userId }).lean()
    let userAddress = {} as any
    let coordinates: any = null
    if (addresses?.length) {
      const defaultAdd = addresses.find((a: any) => a.isDefault)
      zipCode = defaultAdd ? defaultAdd?.postalCode : addresses[0]?.postalCode
      userAddress = defaultAdd ? defaultAdd : addresses[0]
    }
    if (userAddress && userAddress?.coordinates) {
      const { longitude, latitude } = userAddress?.coordinates
      coordinates = { longitude, latitude }
    } else {
      const zipCodeData: any = await ZipCodesModel.findOne({ zipCode: zipCode }).lean()
      if (zipCodeData) {
        const [longitude, latitude] = zipCodeData?.location?.coordinates
        coordinates = { longitude, latitude }
      }
    }

    // Check if total amount exeeds more than charge free amount
    const totalCartPrice = await this.totalCartPrice(cart?.items)

    const deliveryPolicy: any = await DeliveryPoliciesModel.findOne({
      postalCodes: zipCode,
      active: true
    }).lean()

    let dMode = deliveryPolicy?.deliveryModes[cart?.deliveryMode]

    const { applicableDeliveryCharge, freeMinOrderValue: freeOrdVal } = this.getApplicableRange(
      totalCartPrice,
      dMode?.priceRange ?? []
    )

    // get active stores
    const activeStores = await this.getActiveStores(deliveryPolicy, zipCode)

    // check if store available with items
    const storeAllocations = await this.getAvailableStore(activeStores, cart.items)
    //  get stores with distance
    const storeWithDistance = await getStoresDistances({
      userZipCode: zipCode,
      userZipLat: coordinates?.latitude,
      userZipLon: coordinates?.longitude,
      activeStores: storeAllocations,
      policyId: deliveryPolicy._id.toString()
    })

    const storesWithLessThan7km: Array<any> = storeWithDistance.filter(
      (store) => store.distance !== undefined && store.distance <= 7000
    )

    const updatedItems = []
    let deliveryCharges = 0
    let freeMinOrderValue = 0

    for (const item of cart?.items) {
      const product = await ProductsModel?.findById(item?.productId).lean()

      // If product not available skip it
      if (!product) continue

      let { isOutOfStock = false, isNotDeliverable = false } = await getProductStockStatus(
        deliveryPolicy,
        item?.productId,
        Number(item?.quantity ?? 1),
        zipCode
      )

      let note = null

      if (cart?.deliveryMode === 'oneDay') {
        isNotDeliverable = !storesWithLessThan7km?.some((s: any) => {
          return s.items?.map((i: any) => i.toString()).includes(product?._id.toString())
        })

        if (isNotDeliverable) {
          // item.isSelected = false
          note =
            'Your selected location is outside the delivery range for Same-Day delivery. Please choose a different delivery mode.'
        }
      }

      const disabled = isNotDeliverable || isOutOfStock

      if (item.isSelected && !deliveryCharges) deliveryCharges = applicableDeliveryCharge
      freeMinOrderValue = freeOrdVal

      const payload = {
        ...product,
        quantity: item.quantity,
        total: product?.finalPrice * item.quantity,
        amount: product?.finalPrice ?? 0,
        discountAmount: item?.discountAmount ?? 0,
        images: product?.images,
        storeId: disabled ? null : item?.storeId,
        deliveryTime: dMode?.deliveryTime ?? null,
        timeDurationType: dMode?.timeDurationType ?? null,
        isSelected: disabled ? false : item.isSelected,
        isOutOfStock,
        isNotDeliverable,
        note,
        deliveryCharges,
        freeMinOrderValue
      }

      updatedItems.push(payload)
    }

    const updatedPayload = {
      ...cart,
      items: updatedItems?.map((i) => {
        return {
          productId: i._id,
          quantity: i.quantity,
          amount: i.amount,
          storeId: i.storeId,
          deliveryTime: i.deliveryTime,
          timeDurationType: i.timeDurationType,
          isSelected: i.isSelected,
          isOutOfStock: i.isOutOfStock,
          isNotDeliverable: i.isNotDeliverable,
          note: i?.note ?? null,
          discountAmount: i.discountAmount ?? 0
        }
      })
    }

    let discountAmount = cart?.discountAmount
    let appliedCouponData = null

    // Check coupon code
    if (cart?.couponCode) {
      const totalCartPrice: number = await this.totalCartPrice(cart?.items)

      try {
        // Use create method (POST) to avoid issues with large item arrays
        const updatedDiscount = await app.service('apply-coupon').create(
          {
            couponCode: cart?.couponCode,
            channel: 'webApp',
            totalAmount: totalCartPrice,
            zipCode: cart?.zipCode,
            items: cart?.items
          },
          { user: params?.user }
        )

        discountAmount = updatedDiscount?.discountValue
        appliedCouponData = updatedDiscount

        if (discountAmount && discountAmount > 0)
          await calculateProductLevelDiscount(
            updatedPayload.items,
            totalCartPrice,
            discountAmount,
            updatedDiscount
          )
      } catch (e) {
        discountAmount = 0
        updatedPayload.couponCode = null
      }
    }

    // Update latest items status
    await cartModel.updateOne({ _id: cart._id }, updatedPayload)

    let availableDeliveryModes = []

    if (deliveryPolicy) {
      const { standard, oneDay } = deliveryPolicy?.deliveryModes
      if (deliveryPolicy?.isOneDayDeliveryAvailable)
        availableDeliveryModes.push({ ...oneDay, mode: 'oneDay' })
      if (deliveryPolicy?.isStandardDeliveryAvailable)
        availableDeliveryModes.push({ ...standard, mode: 'standard' })
    }

    return { ...cart, items: updatedItems, discountAmount, appliedCouponData, availableDeliveryModes }
  }

  async totalCartPrice(items: any) {
    try {
      let totalPrice = 0
      for (const item of items) {
        if (item?.isSelected) {
          const product = await ProductsModel.findById(item?.productId).select('finalPrice').lean()
          if (product) totalPrice = totalPrice + product?.finalPrice * item?.quantity
        }
      }
      return totalPrice
    } catch (error) {
      throw error
    }
  }
}

export class CartVerifyProductService<ServiceParams extends Params = CartsParams> extends MongoDBService<
  Carts,
  CartsData,
  CartsParams,
  CartsPatch
> {
  async create(data: CartsData | any, params?: ServiceParams): Promise<any> {
    try {
      const userId = params?.user?._id
      const { productId, addressId, quantity } = data

      let zipCode = data?.zipCode
      let userLat: number | null = null
      let userLon: number | null = null

      if (addressId) {
        const addressChoose = data?.addressId ? { _id: data?.addressId } : { isDefault: true }
        const userAddress = await userAddressModel
          .findOne({ userId: userId, ...addressChoose })
          .select('postalCode coordinates')
          .lean()
        if (userAddress) {
          zipCode = userAddress?.postalCode
          // Get coordinates from address if available
          if (userAddress.coordinates?.latitude && userAddress.coordinates?.longitude) {
            userLat = userAddress.coordinates.latitude
            userLon = userAddress.coordinates.longitude
          }
        }
      }

      const deliveryPolicy = await DeliveryPoliciesModel.findOne({
        postalCodes: zipCode,
        active: true
      }).lean()

      if (!deliveryPolicy) throw new Error('NOT_DELIVERABLE')

      const activeStores = await StoreModel.find({
        _id: { $in: deliveryPolicy?.stores },
        active: true,
        $or: [{ deleted: { $exists: false } }, { deleted: false }],
        serviceableZip: { $in: parseInt(zipCode) }
      })
        .select('_id')
        .lean()

      if (!activeStores.length) throw new Error('NOT_DELIVERABLE')

      const productStock = await StoreInventoryModel.find({
        storeId: { $in: activeStores.map((s) => s._id) },
        productId: productId,
        stock: { $gt: 0 },
        $expr: {
          $gt: [
            {
              $subtract: [
                {
                  $subtract: [
                    '$stock',
                    { $ifNull: ['$softHoldCount', 0] } // First subtraction
                  ]
                },
                { $ifNull: ['$softHoldForOrderCount', 0] } // Second subtraction
              ]
            }, // field2 - field1
            0 // only include documents where the result is > 0
          ]
        }
      })
        .select('_id stock softHoldCount softHoldForOrderCount storeId batches')
        .lean()

      const validBatches = getBatchesExpiryMoreThan90Days({
        batches: productStock?.flatMap((s) => s.batches)
      })

      if (!productStock.length || !validBatches.length) throw new Error('OUT_OF_STOCK')

      if (quantity) {
        const available = productStock.filter(
          (ps: any) => ps.stock - (ps.softHoldCount ?? 0) - (ps.softHoldForOrderCount ?? 0) >= quantity
        )
        if (!available.length) throw new Error('NO_ENOUGH_QUANTITY')
      }

      // Get coordinates from zipCode if not already available
      if (!userLat || !userLon) {
        const zipCodeData = await ZipCodesModel.findOne({ zipCode: String(zipCode) }).lean()
        if (zipCodeData?.location?.coordinates) {
          userLon = zipCodeData.location.coordinates[0]
          userLat = zipCodeData.location.coordinates[1]
        }
      }

      // Sort by distance if coordinates are available
      if (userLat && userLon) {
        // Add storeId to match the format expected by getStoresDistances
        const storesWithIds = productStock.map((ps: any) => ({
          storeId: ps.storeId,
          ...ps
        }))

        // Ensure stores are cached in Redis before calculating distances
        await getStore(
          deliveryPolicy._id.toString(),
          storesWithIds.map((s: any) => ({ _id: s.storeId }))
        )

        const storesWithDistance = await getStoresDistances({
          userZipCode: String(zipCode),
          userZipLat: Number(userLat),
          userZipLon: Number(userLon),
          activeStores: storesWithIds,
          policyId: deliveryPolicy._id.toString()
        })

        // Sort by distance (ascending - nearest first)
        storesWithDistance.sort((a: any, b: any) => {
          const distA = a.distance ?? Infinity
          const distB = b.distance ?? Infinity
          return distA - distB
        })

        return storesWithDistance
      }

      return productStock
    } catch (error) {
      throw error
    }
  }
}

export class CartCheckOneDayDeliveryService<
  ServiceParams extends Params = CartsParams
> extends MongoDBService<Carts, CartsData, CartsParams, CartsPatch> {
  async create(data: CartsData | any, params?: ServiceParams): Promise<any> {
    try {
      const userId = params?.user?._id
      const { addressId } = data
      const cart: any = await cartModel.findOne({ userId }).lean()

      // Get user address and zip code
      const userAddress = await userAddressModel
        .findOne({
          _id: addressId,
          userId: userId
        })
        .lean()

      if (!userAddress) {
        throw new Error('ADDRESS_NOT_FOUND')
      }

      const zipCode = userAddress.postalCode

      // Get coordinates
      let coordinates: any = null
      if (userAddress?.coordinates) {
        const { longitude, latitude } = userAddress?.coordinates
        coordinates = { longitude, latitude }
      } else {
        const zipCodeData: any = await ZipCodesModel.findOne({ zipCode: zipCode }).lean()
        if (zipCodeData) {
          const [longitude, latitude] = zipCodeData?.location?.coordinates
          coordinates = { longitude, latitude }
        }
      }

      // Fetch delivery policy
      const deliveryPolicy: any = await DeliveryPoliciesModel.findOne({
        postalCodes: zipCode,
        active: true
      }).lean()

      if (!deliveryPolicy || !deliveryPolicy?.isOneDayDeliveryAvailable) {
        return { isOneDayDeliverable: false, reason: 'One day delivery not available for this location' }
      }

      // Get active stores
      const activeStores = await StoreModel.find({
        _id: { $in: deliveryPolicy?.stores },
        active: true,
        $or: [{ deleted: { $exists: false } }, { deleted: false }],
        serviceableZip: { $in: parseInt(zipCode) }
      }).lean()

      if (!activeStores.length) {
        return { isOneDayDeliverable: false, reason: 'No active stores available' }
      }

      // Check if store available with items
      const availableStores = await this.getAvailableStore(activeStores, cart?.items)

      if (!availableStores.length) {
        return { isOneDayDeliverable: false, reason: 'Items not available in any store' }
      }

      // Get stores with distance
      const storeWithDistance = await getStoresDistances({
        userZipCode: zipCode,
        userZipLat: coordinates?.latitude,
        userZipLon: coordinates?.longitude,
        activeStores: availableStores,
        policyId: deliveryPolicy?._id?.toString()
      })

      // Filter stores within 7km for one-day delivery
      const storesWithLessThan7km: Array<any> = storeWithDistance.filter(
        (store) => store.distance !== undefined && store.distance <= 7000
      )

      // Check if all items are available in stores within 7km
      let allItemsDeliverable = true
      const undeliverableItems = []

      for (const item of cart?.items) {
        const isDeliverable = storesWithLessThan7km?.some((s: any) => {
          return s.items?.map((i: any) => i.toString()).includes(item.productId.toString())
        })

        if (!isDeliverable) {
          allItemsDeliverable = false
          undeliverableItems.push(item.productId)
        }
      }

      return {
        isOneDayDeliverable: allItemsDeliverable,
        reason: allItemsDeliverable
          ? 'All items are deliverable in one day'
          : 'Some items are not deliverable in one day',
        undeliverableItems: undeliverableItems.length > 0 ? undeliverableItems : undefined
      }
    } catch (error) {
      throw error
    }
  }

  async getAvailableStore(stores: any, items: any) {
    const productStock = await StoreInventoryModel.aggregate([
      {
        $match: {
          storeId: { $in: stores.map((s: any) => s._id) },
          productId: { $in: items.map((i: any) => i.productId) },
          stock: { $gt: 0 },
          $expr: {
            $gte: [
              {
                $subtract: [
                  {
                    $subtract: [
                      '$stock',
                      { $ifNull: ['$softHoldCount', 0] } // First subtraction
                    ]
                  },
                  { $ifNull: ['$softHoldForOrderCount', 0] } // Second subtraction
                ]
              }, // Result of the subtraction
              0 // Ensure stock is greater than 0
            ]
          }
        }
      },
      {
        $group: {
          _id: '$storeId', // Group by storeId
          items: { $addToSet: '$productId' } // Collect product IDs for each store
        }
      },
      {
        $project: {
          _id: 0,
          storeId: '$_id',
          items: 1 // Renaming products to items
        }
      }
    ])

    return productStock.length ? productStock : []
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('carts'))
  }
}
