// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { RefundService } from './refund.class'
import { ModelObjectId } from '../../utils'
import { paymentGateways } from '../../type'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const refundSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    orderItemId: Type.Optional(ModelObjectId({ mongoose: { ref: 'order-items' } })),
    order: Type.Optional(ModelObjectId({ mongoose: { ref: 'orders' } })),
    membershipOrder: Type.Optional(ModelObjectId({ mongoose: { ref: 'membership-orders' } })),
    paymentGateway: paymentGateways,
    paymentFor: StringEnum(['order', 'membership']),
    status: Type.String(),
    refundId: Type.String({ mongoose: { unique: true } }),
    amount: Type.Number(),
    currency: Type.String(),
    refundResponse: Type.Any(),
    paymentId: Type.String() // can be multiple for same order
  },
  { $id: 'Refund', additionalProperties: false }
)
export type Refund = Static<typeof refundSchema>
export const refundValidator = getValidator(refundSchema, dataValidator)
export const refundResolver = resolve<Refund, HookContext<RefundService>>({})

export const refundExternalResolver = resolve<Refund, HookContext<RefundService>>({})

// Schema for creating new entries
export const refundDataSchema = Type.Pick(refundSchema, [], {
  $id: 'RefundData'
})
export type RefundData = Static<typeof refundDataSchema>
export const refundDataValidator = getValidator(refundDataSchema, dataValidator)
export const refundDataResolver = resolve<Refund, HookContext<RefundService>>({})

// Schema for updating existing entries
export const refundPatchSchema = Type.Partial(refundSchema, {
  $id: 'RefundPatch'
})
export type RefundPatch = Static<typeof refundPatchSchema>
export const refundPatchValidator = getValidator(refundPatchSchema, dataValidator)
export const refundPatchResolver = resolve<Refund, HookContext<RefundService>>({})

// Schema for allowed query properties
export const refundQueryProperties = Type.Pick(refundSchema, [])
export const refundQuerySchema = Type.Intersect(
  [
    querySyntax(refundQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type RefundQuery = Static<typeof refundQuerySchema>
export const refundQueryValidator = getValidator(refundQuerySchema, queryValidator)
export const refundQueryResolver = resolve<RefundQuery, HookContext<RefundService>>({})

export const refundDb = Type.Omit(refundSchema, ['_id'], { $id: 'RefundDb' })

const mongooseSchema = typeboxToMongooseSchema(refundDb)

export const RefundModal = makeMongooseModel('refunds', mongooseSchema)
