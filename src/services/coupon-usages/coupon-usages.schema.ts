// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { CouponUsagesService } from './coupon-usages.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const couponUsagesSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    couponId: ModelObjectId({ mongoose: { ref: 'coupons' } }),
    customerId: ModelObjectId({ mongoose: { ref: 'users' } }),
    orderId: ModelObjectId({ mongoose: { ref: 'order' } }),
    createdAt: Type.String({ format: 'date-time' })
  },
  { $id: 'CouponUsages', additionalProperties: false }
)
export type CouponUsages = Static<typeof couponUsagesSchema>
export const couponUsagesValidator = getValidator(couponUsagesSchema, dataValidator)
export const couponUsagesResolver = resolve<CouponUsages, HookContext<CouponUsagesService>>({})

export const couponUsagesExternalResolver = resolve<CouponUsages, HookContext<CouponUsagesService>>({})

// Schema for creating new entries
export const couponUsagesDataSchema = Type.Pick(
  couponUsagesSchema,
  ['couponId', 'customerId', 'orderId', 'createdAt'],
  {
    $id: 'CouponUsagesData'
  }
)
export type CouponUsagesData = Static<typeof couponUsagesDataSchema>
export const couponUsagesDataValidator = getValidator(couponUsagesDataSchema, dataValidator)
export const couponUsagesDataResolver = resolve<CouponUsages, HookContext<CouponUsagesService>>({})

// Schema for updating existing entries
export const couponUsagesPatchSchema = Type.Partial(couponUsagesSchema, {
  $id: 'CouponUsagesPatch'
})
export type CouponUsagesPatch = Static<typeof couponUsagesPatchSchema>
export const couponUsagesPatchValidator = getValidator(couponUsagesPatchSchema, dataValidator)
export const couponUsagesPatchResolver = resolve<CouponUsages, HookContext<CouponUsagesService>>({})

// Schema for allowed query properties
export const couponUsagesQueryProperties = Type.Pick(couponUsagesSchema, ['_id'])
export const couponUsagesQuerySchema = Type.Intersect(
  [
    querySyntax(couponUsagesQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type CouponUsagesQuery = Static<typeof couponUsagesQuerySchema>
export const couponUsagesQueryValidator = getValidator(couponUsagesQuerySchema, queryValidator)
export const couponUsagesQueryResolver = resolve<CouponUsagesQuery, HookContext<CouponUsagesService>>({})

export const CouponUsagesDb = Type.Pick(
  couponUsagesSchema,
  ['couponId', 'customerId', 'orderId', 'createdAt'],
  {
    $id: 'CouponUsagesDb'
  }
)

const mongooseSchema = typeboxToMongooseSchema(CouponUsagesDb)
export const CouponUsagesModel = makeMongooseModel('couponUsages', mongooseSchema)
