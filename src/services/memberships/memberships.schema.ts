// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { MembershipsService } from './memberships.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'
import { InferRawDocType } from 'mongoose'

export const MEMBERSHIP_STATUS = {
  ACTIVE: 'active',
  HOLD: 'hold',
  EXPIRED: 'expired'
}

// Main data model schema
export const membershipsSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    user: ModelObjectId({ mongoose: { ref: 'users' } }),
    membershipOrder: ModelObjectId({ mongoose: { ref: 'membership-orders' } }),
    status: StringEnum([...Object.values(MEMBERSHIP_STATUS)], { default: 'active' }),
    freeDeliveryBalance: Type.Number({ default: 0 }),
    durationInMonths: Type.Number({ default: 0 }),
    expiryOn: Type.Optional(Type.String({ format: 'date-time' })),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
  },
  { $id: 'Memberships', additionalProperties: false }
)
export type Memberships = Static<typeof membershipsSchema>
export const membershipsValidator = getValidator(membershipsSchema, dataValidator)
export const membershipsResolver = resolve<Memberships, HookContext<MembershipsService>>({})

export const membershipsExternalResolver = resolve<Memberships, HookContext<MembershipsService>>({})

// Schema for creating new entries
export const membershipsDataSchema = Type.Pick(
  membershipsSchema,
  [
    'user',
    'membershipOrder',
    'status',
    'freeDeliveryBalance',
    'durationInMonths',
    'expiryOn',
    'createdAt',
    'updatedAt'
  ],
  {
    $id: 'MembershipsData'
  }
)
export type MembershipsData = Static<typeof membershipsDataSchema>
export const membershipsDataValidator = getValidator(membershipsDataSchema, dataValidator)
export const membershipsDataResolver = resolve<Memberships, HookContext<MembershipsService>>({})

// Schema for updating existing entries
export const membershipsPatchSchema = Type.Partial(membershipsSchema, {
  $id: 'MembershipsPatch'
})
export type MembershipsPatch = Static<typeof membershipsPatchSchema>
export const membershipsPatchValidator = getValidator(membershipsPatchSchema, dataValidator)
export const membershipsPatchResolver = resolve<Memberships, HookContext<MembershipsService>>({})

// Schema for allowed query properties
export const membershipsQueryProperties = Type.Pick(membershipsSchema, ['_id', 'user', 'expiryOn'])
export const membershipsQuerySchema = Type.Intersect(
  [
    querySyntax(membershipsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type MembershipsQuery = Static<typeof membershipsQuerySchema>
export const membershipsQueryValidator = getValidator(membershipsQuerySchema, queryValidator)
export const membershipsQueryResolver = resolve<MembershipsQuery, HookContext<MembershipsService>>({})

export const MembershipDb = Type.Omit(membershipsSchema, ['_id'], {
  $id: 'MembershipDb'
})

export type TMembershipDb = Static<typeof MembershipDb>

const mongooseSchema = typeboxToMongooseSchema(MembershipDb)

export type TMembershipDbSchema = InferRawDocType<typeof mongooseSchema>

export const MembershipModel = makeMongooseModel('memberships', mongooseSchema)
