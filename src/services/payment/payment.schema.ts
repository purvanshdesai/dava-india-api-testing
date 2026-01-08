// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { PaymentService } from './payment.class'
import { ModelObjectId } from '../../utils'
import { paymentGateways } from '../../type'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const paymentSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    order: Type.Optional(ModelObjectId({ mongoose: { ref: 'orders' } })),
    membershipOrder: Type.Optional(ModelObjectId({ mongoose: { ref: 'membership-orders' } })),
    paymentFor: StringEnum(['order', 'membership']),
    paymentGateway: paymentGateways,
    status: Type.String(),
    transactionId: Type.String(),
    amount: Type.Number(),
    currency: Type.String(),
    paymentResponse: Type.Any(),
    paymentOrderId: Type.String()
  },
  { $id: 'Payment', additionalProperties: false }
)
export type Payment = Static<typeof paymentSchema>
export const paymentValidator = getValidator(paymentSchema, dataValidator)
export const paymentResolver = resolve<Payment, HookContext<PaymentService>>({})

export const paymentExternalResolver = resolve<Payment, HookContext<PaymentService>>({})

// Schema for creating new entries
export const paymentDataSchema = Type.Pick(paymentSchema, [], {
  $id: 'PaymentData'
})
export type PaymentData = Static<typeof paymentDataSchema>
export const paymentDataValidator = getValidator(paymentDataSchema, dataValidator)
export const paymentDataResolver = resolve<Payment, HookContext<PaymentService>>({})

// Schema for updating existing entries
export const paymentPatchSchema = Type.Partial(paymentSchema, {
  $id: 'PaymentPatch'
})
export type PaymentPatch = Static<typeof paymentPatchSchema>
export const paymentPatchValidator = getValidator(paymentPatchSchema, dataValidator)
export const paymentPatchResolver = resolve<Payment, HookContext<PaymentService>>({})

// Schema for allowed query properties
export const paymentQueryProperties = Type.Pick(paymentSchema, [])
export const paymentQuerySchema = Type.Intersect(
  [
    querySyntax(paymentQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type PaymentQuery = Static<typeof paymentQuerySchema>
export const paymentQueryValidator = getValidator(paymentQuerySchema, queryValidator)
export const paymentQueryResolver = resolve<PaymentQuery, HookContext<PaymentService>>({})

export const PaymentDb = Type.Omit(paymentSchema, ['_id'], { $id: 'PaymentDb' })

export type TPaymentDb = Static<typeof PaymentDb>

const mongooseSchema = typeboxToMongooseSchema(PaymentDb)

export const PaymentModel = makeMongooseModel('payments', mongooseSchema)
