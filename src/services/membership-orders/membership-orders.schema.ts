// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { MembershipOrdersService } from './membership-orders.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'
import { InferRawDocType } from 'mongoose'

// Main data model schema
export const membershipOrdersSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    user: ModelObjectId({ mongoose: { ref: 'users' } }),
    status: StringEnum(['pending', 'paid', 'failed'], { default: 'pending' }),
    paymentGateway: Type.String(),
    paymentAmount: Type.Number(),
    paymentOrderId: Type.Optional(Type.String()),
    deviceType: Type.Optional(StringEnum(['web', 'mobile-web', 'android', 'ios'])),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
  },
  { $id: 'MembershipOrders', additionalProperties: false }
)
export type MembershipOrders = Static<typeof membershipOrdersSchema>
export const membershipOrdersValidator = getValidator(membershipOrdersSchema, dataValidator)
export const membershipOrdersResolver = resolve<MembershipOrders, HookContext<MembershipOrdersService>>({})

export const membershipOrdersExternalResolver = resolve<
  MembershipOrders,
  HookContext<MembershipOrdersService>
>({})

// Schema for creating new entries
export const membershipOrdersDataSchema = Type.Pick(
  membershipOrdersSchema,
  ['createdAt', 'updatedAt', 'paymentOrderId', 'deviceType'],
  {
    $id: 'MembershipOrdersData'
  }
)
export type MembershipOrdersData = Static<typeof membershipOrdersDataSchema>
export const membershipOrdersDataValidator = getValidator(membershipOrdersDataSchema, dataValidator)
export const membershipOrdersDataResolver = resolve<MembershipOrders, HookContext<MembershipOrdersService>>(
  {}
)

// Schema for updating existing entries
export const membershipOrdersPatchSchema = Type.Partial(membershipOrdersSchema, {
  $id: 'MembershipOrdersPatch'
})
export type MembershipOrdersPatch = Static<typeof membershipOrdersPatchSchema>
export const membershipOrdersPatchValidator = getValidator(membershipOrdersPatchSchema, dataValidator)
export const membershipOrdersPatchResolver = resolve<MembershipOrders, HookContext<MembershipOrdersService>>(
  {}
)

// Schema for allowed query properties
export const membershipOrdersQueryProperties = Type.Pick(membershipOrdersSchema, ['_id'])
export const membershipOrdersQuerySchema = Type.Intersect(
  [
    querySyntax(membershipOrdersQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type MembershipOrdersQuery = Static<typeof membershipOrdersQuerySchema>
export const membershipOrdersQueryValidator = getValidator(membershipOrdersQuerySchema, queryValidator)
export const membershipOrdersQueryResolver = resolve<
  MembershipOrdersQuery,
  HookContext<MembershipOrdersService>
>({})

export const MembershipOrderDb = Type.Omit(membershipOrdersSchema, ['_id'], {
  $id: 'MembershipOrderDb'
})

export type TMembershipOrderDb = Static<typeof MembershipOrderDb>

const mongooseSchema = typeboxToMongooseSchema(MembershipOrderDb)

export type TMembershipOrderDbSchema = InferRawDocType<typeof mongooseSchema>

export const MembershipOrderModel = makeMongooseModel('membership-orders', mongooseSchema)
