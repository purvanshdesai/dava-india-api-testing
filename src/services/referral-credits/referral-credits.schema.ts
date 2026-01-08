// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { ReferralCreditsService } from './referral-credits.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const referralCreditsSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    referrerUserId: Type.Union([ModelObjectId({ mongoose: { ref: 'users' } }), Type.Null()]),
    referredUserId: Type.Union([ModelObjectId({ mongoose: { ref: 'users' } }), Type.Null()]),
    referralCode: Type.String(),
    creditedAt: Type.String({ format: 'date-time' }),
    coinsCredited: Type.Number(),
    orderId: Type.Union([ModelObjectId({ mongoose: { ref: 'orders' } }), Type.Null()]),
    status: Type.String()
  },
  { $id: 'ReferralCredits', additionalProperties: false }
)
export type ReferralCredits = Static<typeof referralCreditsSchema>
export const referralCreditsValidator = getValidator(referralCreditsSchema, dataValidator)
export const referralCreditsResolver = resolve<ReferralCredits, HookContext<ReferralCreditsService>>({})

export const referralCreditsExternalResolver = resolve<ReferralCredits, HookContext<ReferralCreditsService>>(
  {}
)

// Schema for creating new entries
export const referralCreditsDataSchema = Type.Pick(
  referralCreditsSchema,
  ['referrerUserId', 'referredUserId', 'referralCode', 'creditedAt', 'coinsCredited', 'orderId', 'status'],
  {
    $id: 'ReferralCreditsData'
  }
)
export type ReferralCreditsData = Static<typeof referralCreditsDataSchema>
export const referralCreditsDataValidator = getValidator(referralCreditsDataSchema, dataValidator)
export const referralCreditsDataResolver = resolve<ReferralCredits, HookContext<ReferralCreditsService>>({})

// Schema for updating existing entries
export const referralCreditsPatchSchema = Type.Partial(referralCreditsSchema, {
  $id: 'ReferralCreditsPatch'
})
export type ReferralCreditsPatch = Static<typeof referralCreditsPatchSchema>
export const referralCreditsPatchValidator = getValidator(referralCreditsPatchSchema, dataValidator)
export const referralCreditsPatchResolver = resolve<ReferralCredits, HookContext<ReferralCreditsService>>({})

// Schema for allowed query properties
export const referralCreditsQueryProperties = Type.Pick(referralCreditsSchema, [
  '_id',
  'referrerUserId',
  'referredUserId',
  'referralCode',
  'creditedAt',
  'coinsCredited',
  'orderId',
  'status'
])
export const referralCreditsQuerySchema = Type.Intersect(
  [
    querySyntax(referralCreditsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type ReferralCreditsQuery = Static<typeof referralCreditsQuerySchema>
export const referralCreditsQueryValidator = getValidator(referralCreditsQuerySchema, queryValidator)
export const referralCreditsQueryResolver = resolve<
  ReferralCreditsQuery,
  HookContext<ReferralCreditsService>
>({})

export const referralCreditsDb = Type.Omit(referralCreditsSchema, ['_id'], { $id: 'ReferralCreditsDb' })

const mongooseSchema = typeboxToMongooseSchema(referralCreditsDb)

export const ReferralCreditsModal = makeMongooseModel('referral-credits', mongooseSchema)
