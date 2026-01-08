// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { UserInvitationsService } from './user-invitations.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const userInvitationsSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    name: Type.String(),
    email: Type.String(),
    role: ModelObjectId({ mongoose: { ref: 'roles' } }),
    invitedBy: ModelObjectId({ mongoose: { ref: 'users' } }),
    token: Type.String(),
    expiryAt: Type.Any(),
    status: StringEnum(['invited', 'accepted', 'rejected']),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
    extraAttr: Type.Optional(
      Type.Object({
        doctorName: Type.Optional(Type.String()),
        doctorWhatsappNumber: Type.Optional(Type.String()),
        qualification: Type.Optional(Type.String()),
        regNo: Type.Optional(Type.String()),
        hospitalName: Type.Optional(Type.String()),
        hospitalAddress: Type.Optional(Type.String())
      })
    )
  },
  { $id: 'UserInvitations', additionalProperties: false }
)
export type UserInvitations = Static<typeof userInvitationsSchema>
export const userInvitationsValidator = getValidator(userInvitationsSchema, dataValidator)
export const userInvitationsResolver = resolve<UserInvitations, HookContext<UserInvitationsService>>({})

export const userInvitationsExternalResolver = resolve<UserInvitations, HookContext<UserInvitationsService>>(
  {}
)

// Schema for creating new entries
export const userInvitationsDataSchema = Type.Pick(
  userInvitationsSchema,
  ['name', 'email', 'role', 'invitedBy', 'token', 'expiryAt', 'status', 'extraAttr'],
  {
    $id: 'UserInvitationsData'
  }
)
export type UserInvitationsData = Static<typeof userInvitationsDataSchema>
export const userInvitationsDataValidator = getValidator(userInvitationsDataSchema, dataValidator)
export const userInvitationsDataResolver = resolve<UserInvitations, HookContext<UserInvitationsService>>({})

// Schema for updating existing entries
export const userInvitationsPatchSchema = Type.Partial(userInvitationsSchema, {
  $id: 'UserInvitationsPatch'
})
export type UserInvitationsPatch = Static<typeof userInvitationsPatchSchema>
export const userInvitationsPatchValidator = getValidator(userInvitationsPatchSchema, dataValidator)
export const userInvitationsPatchResolver = resolve<UserInvitations, HookContext<UserInvitationsService>>({})

// Schema for allowed query properties
export const userInvitationsQueryProperties = Type.Pick(userInvitationsSchema, [
  '_id',
  'name',
  'email',
  'role',
  'invitedBy',
  'token',
  'expiryAt',
  'status',
  'extraAttr'
])
export const userInvitationsQuerySchema = Type.Intersect(
  [
    querySyntax(userInvitationsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type UserInvitationsQuery = Static<typeof userInvitationsQuerySchema>
export const userInvitationsQueryValidator = getValidator(userInvitationsQuerySchema, queryValidator)
export const userInvitationsQueryResolver = resolve<
  UserInvitationsQuery,
  HookContext<UserInvitationsService>
>({})

export const invitationDb = Type.Pick(
  userInvitationsSchema,
  [
    'name',
    'email',
    'role',
    'invitedBy',
    'token',
    'expiryAt',
    'status',
    'createdAt',
    'updatedAt',
    'extraAttr'
  ],
  {
    $id: 'userInvitationDb'
  }
)

const mongooseSchema = typeboxToMongooseSchema(invitationDb)

export const UserInvitationModel = makeMongooseModel('user-invitations', mongooseSchema)
