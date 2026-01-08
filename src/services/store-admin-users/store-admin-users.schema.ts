// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { StoreAdminUsersService } from './store-admin-users.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const storeAdminUsersSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    fullName: Type.String(),
    email: Type.String({ format: 'email', mongoose: { unique: true } }),
    // storeIds: Type.Array(ModelObjectId({ mongoose: { ref: 'stores', unique: true } })),
    storeIds: Type.Array(
      Type.Union([Type.String({ objectid: true }), Type.Object({}, { additionalProperties: true })], {
        mongoose: { ref: 'stores', unique: true }
      })
    ),
    passwordResetToken: Type.String(),
    passwordResetTokenExpiry: Type.String({ format: 'date-time' }),
    password: Type.String(),
    phoneNumber: Type.Optional(Type.String())
  },
  { $id: 'StoreAdminUsers', additionalProperties: false }
)
export type StoreAdminUsers = Static<typeof storeAdminUsersSchema>
export const storeAdminUsersValidator = getValidator(storeAdminUsersSchema, dataValidator)
export const storeAdminUsersResolver = resolve<StoreAdminUsers, HookContext<StoreAdminUsersService>>({})

export const storeAdminUsersExternalResolver = resolve<StoreAdminUsers, HookContext<StoreAdminUsersService>>(
  {}
)

// Schema for creating new entries
export const storeAdminUsersDataSchema = Type.Pick(storeAdminUsersSchema, [], {
  $id: 'StoreAdminUsersData'
})
export type StoreAdminUsersData = Static<typeof storeAdminUsersDataSchema>
export const storeAdminUsersDataValidator = getValidator(storeAdminUsersDataSchema, dataValidator)
export const storeAdminUsersDataResolver = resolve<StoreAdminUsers, HookContext<StoreAdminUsersService>>({})

// Schema for updating existing entries
export const storeAdminUsersPatchSchema = Type.Partial(storeAdminUsersSchema, {
  $id: 'StoreAdminUsersPatch'
})
export type StoreAdminUsersPatch = Static<typeof storeAdminUsersPatchSchema>
export const storeAdminUsersPatchValidator = getValidator(storeAdminUsersPatchSchema, dataValidator)
export const storeAdminUsersPatchResolver = resolve<StoreAdminUsers, HookContext<StoreAdminUsersService>>({})

// Schema for allowed query properties
export const storeAdminUsersQueryProperties = Type.Pick(storeAdminUsersSchema, [])
export const storeAdminUsersQuerySchema = Type.Intersect(
  [
    querySyntax(storeAdminUsersQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type StoreAdminUsersQuery = Static<typeof storeAdminUsersQuerySchema>
export const storeAdminUsersQueryValidator = getValidator(storeAdminUsersQuerySchema, queryValidator)
export const storeAdminUsersQueryResolver = resolve<
  StoreAdminUsersQuery,
  HookContext<StoreAdminUsersService>
>({})

const storeAdminUserDb = Type.Omit(storeAdminUsersSchema, ['_id'], { $id: 'StoreAdminUserDb' })

const mongooseSchema = typeboxToMongooseSchema(storeAdminUserDb)

export const StoreAdminUserModal = makeMongooseModel('store-admin-users', mongooseSchema)
