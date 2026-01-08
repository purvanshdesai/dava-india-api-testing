// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { CouponsService } from './coupons.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const CONSTANTS = {
  DISCOUNT_TYPE: {
    PERCENTAGE: 'percentage',
    FIXED_AMOUNT: 'fixedAmount'
  },
  USAGE_LIMIT: {
    ONE_TIME: 'oneTime',
    UNLIMITED: 'unlimited'
  },
  CHANNELS: {
    WEB_APP: 'webApp',
    MOBILE_APP: 'mobileApp',
    BOTH: 'both'
  },
  USER_TYPE: {
    FIRST_TIME_USER: 'firstTimeUser',
    REPEATED_USER: 'repeatedUser',
    COMMON: 'common'
  }
}

export const couponsSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    couponName: Type.String(),
    discountType: StringEnum([CONSTANTS.DISCOUNT_TYPE.PERCENTAGE, CONSTANTS.DISCOUNT_TYPE.FIXED_AMOUNT]),
    couponCode: Type.String(),
    description: Type.Optional(Type.String()),
    customUsageLimit: Type.Optional(Type.Boolean()),
    usageLimit: Type.Union([
      StringEnum([CONSTANTS.USAGE_LIMIT.ONE_TIME, CONSTANTS.USAGE_LIMIT.UNLIMITED]),
      Type.Number({ minimum: 1 })
    ]),
    discountValue: Type.Number(),
    maximumDiscountValue: Type.Optional(Type.Number()),
    minimumPurchaseValue: Type.Optional(Type.Number()),
    startDate: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
    expiryDate: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
    products: Type.Optional(Type.Array(ModelObjectId({ mongoose: { ref: 'products' } }))),
    collections: Type.Optional(Type.Array(ModelObjectId({ mongoose: { ref: 'collections' } }))),
    channels: StringEnum([
      CONSTANTS.CHANNELS.WEB_APP,
      CONSTANTS.CHANNELS.MOBILE_APP,
      CONSTANTS.CHANNELS.BOTH
    ]),
    forEmails: Type.Optional(Type.Array(Type.String({ format: 'email' }))),
    forPhoneNos: Type.Optional(Type.Array(Type.String())),
    active: Type.Boolean(),
    archive: Type.Boolean(),
    createdBy: ModelObjectId({ mongoose: { ref: 'super-admin-users' } }),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
    forUserType: StringEnum([
      CONSTANTS.USER_TYPE.FIRST_TIME_USER,
      CONSTANTS.USER_TYPE.REPEATED_USER,
      CONSTANTS.USER_TYPE.COMMON
    ]),
    deliveryPolicies: Type.Optional(Type.Array(ModelObjectId({ mongoose: { ref: 'delivery-policies' } }))),
    isOfflineCoupon: Type.Optional(Type.Boolean())
  },
  { $id: 'Coupons', additionalProperties: false }
)
export type Coupons = Static<typeof couponsSchema>
export const couponsValidator = getValidator(couponsSchema, dataValidator)
export const couponsResolver = resolve<Coupons, HookContext<CouponsService>>({})

export const couponsExternalResolver = resolve<Coupons, HookContext<CouponsService>>({})

// Schema for creating new entries
export const couponsDataSchema = Type.Pick(
  couponsSchema,
  [
    'couponName',
    'discountType',
    'couponCode',
    'description',
    'customUsageLimit',
    'usageLimit',
    'discountValue',
    'maximumDiscountValue',
    'minimumPurchaseValue',
    'startDate',
    'expiryDate',
    'products',
    'collections',
    'channels',
    'forEmails',
    'forPhoneNos',
    'active',
    'archive',
    // 'createdBy',
    'createdAt',
    'forUserType',
    'deliveryPolicies',
    'isOfflineCoupon'
  ],
  {
    $id: 'CouponsData'
  }
)
export type CouponsData = Static<typeof couponsDataSchema>
export const couponsDataValidator = getValidator(couponsDataSchema, dataValidator)
export const couponsDataResolver = resolve<Coupons, HookContext<CouponsService>>({})

// Schema for updating existing entries
export const couponsPatchSchema = Type.Partial(couponsSchema, {
  $id: 'CouponsPatch'
})
export type CouponsPatch = Static<typeof couponsPatchSchema>
export const couponsPatchValidator = getValidator(couponsPatchSchema, dataValidator)
export const couponsPatchResolver = resolve<Coupons, HookContext<CouponsService>>({})

// Schema for allowed query properties
export const couponsQueryProperties = Type.Pick(couponsSchema, ['_id'])
export const couponsQuerySchema = Type.Intersect(
  [
    querySyntax(couponsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: true })
  ],
  { additionalProperties: true }
)
export type CouponsQuery = Static<typeof couponsQuerySchema>
export const couponsQueryValidator = getValidator(couponsQuerySchema, queryValidator)
export const couponsQueryResolver = resolve<CouponsQuery, HookContext<CouponsService>>({})

// export const CouponsDb = Type.Omit(couponsSchema, ['_id'], { $id: 'CouponsDb' })
export const CouponsDb = Type.Pick(
  couponsSchema,
  [
    'couponName',
    'discountType',
    'couponCode',
    'description',
    'customUsageLimit',
    'usageLimit',
    'discountValue',
    'maximumDiscountValue',
    'minimumPurchaseValue',
    'startDate',
    'expiryDate',
    'products',
    'collections',
    'channels',
    'forEmails',
    'forPhoneNos',
    'active',
    'archive',
    'createdBy',
    'createdAt',
    'updatedAt',
    'forUserType',
    'deliveryPolicies',
    'isOfflineCoupon'
  ],
  {
    $id: 'CouponsDb'
  }
)

// export type TCouponsDb = Static<typeof couponsDataSchema>

const mongooseSchema = typeboxToMongooseSchema(CouponsDb)
export const CouponsModel = makeMongooseModel('coupons', mongooseSchema)
