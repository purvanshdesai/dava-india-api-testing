// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import { passwordHash } from '@feathersjs/authentication-local'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { UserService } from './users.class'
import { typeboxToMongooseSchema, makeMongooseModel } from '../../utils/mongoose'
import { ModelObjectId } from '../../utils'

export const CONSTANTS = {
  GENDER: {
    MALE: 'male',
    FEMALE: 'female',
    OTHERS: 'others'
  }
}

// Main data model schema
export const userSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    email: Type.Optional(
      Type.Union([
        Type.String({ format: 'email', mongoose: { lowercase: true, trim: true } }),
        Type.Literal('')
      ])
    ),
    phoneNumber: Type.Optional(Type.String()),
    password: Type.Optional(Type.String()),
    googleId: Type.Optional(Type.String()),
    accountVerified: Type.Optional(Type.Boolean()),
    tempPhoneNumber: Type.Optional(Type.String()),
    phoneOtp: Type.Optional(Type.String()),
    phoneOtpValidTill: Type.Optional(Type.String({ format: 'date-time' })),
    name: Type.String(),
    passwordResetToken: Type.Optional(Type.String()),
    passwordResetTokenExpiry: Type.Optional(Type.String({ format: 'date-time' })),
    dateOfBirth: Type.Optional(Type.Union([Type.String({ format: 'date-time' }), Type.Null()])),
    gender: Type.Optional(
      Type.Union([
        StringEnum([CONSTANTS.GENDER.MALE, CONSTANTS.GENDER.FEMALE, CONSTANTS.GENDER.OTHERS]),
        Type.Null(),
        Type.String()
      ])
    ),
    height: Type.Optional(Type.String()),
    weight: Type.Optional(Type.String()),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' })),
    hasDavaoneMembership: Type.Optional(Type.Boolean({ default: false })),
    davaCoinsBalance: Type.Optional(Type.Number({ default: 0 })),
    davaoneMembership: Type.Optional(
      Type.Union([ModelObjectId({ mongoose: { ref: 'memberships' } }), Type.Null()])
    ),
    hash: Type.Optional(Type.String()),
    profileToken: Type.Optional(
      Type.Union([
        Type.String({
          mongoose: {
            index: true,
            sparse: true
          }
        })
      ])
    ),
    profileTokenValidTill: Type.Optional(Type.String({ format: 'date-time' })),
    identifierType: Type.Optional(StringEnum(['mobile', 'email'])),
    isWeb: Type.Optional(Type.Boolean()),
    referralCode: Type.Optional(Type.String()),
    referral: Type.Optional(
      Type.Object({
        code: Type.String(),
        referredByUserId: Type.Union([ModelObjectId({ mongoose: { ref: 'users' } }), Type.Null()]),
        referredAt: Type.String({ format: 'date-time' }),
        referralCredited: Type.Boolean()
      })
    )
  },
  { $id: 'User', additionalProperties: true }
)
export type User = Static<typeof userSchema>
export const userValidator = getValidator(userSchema, dataValidator)
export const userResolver = resolve<User, HookContext<UserService>>({})

export const userExternalResolver = resolve<User, HookContext<UserService>>({
  // The password should never be visible externally
  password: async () => undefined
})

// Schema for creating new entries
export const userDataSchema = Type.Pick(
  userSchema,
  [
    'email',
    'password',
    'googleId',
    'phoneNumber',
    'accountVerified',
    'tempPhoneNumber',
    'phoneOtp',
    'phoneOtpValidTill',
    'name',
    'passwordResetToken',
    'passwordResetTokenExpiry',
    'hash',
    'dateOfBirth',
    'gender',
    'height',
    'weight',
    'createdAt',
    'updatedAt',
    'hasDavaoneMembership',
    'davaoneMembership',
    'davaCoinsBalance',
    'profileToken',
    'profileTokenValidTill',
    'identifierType',
    'isWeb',
    'referralCode',
    'referral'
  ],
  {
    $id: 'UserData'
  }
)
export type UserData = Static<typeof userDataSchema>
export const userDataValidator = getValidator(userDataSchema, dataValidator)
export const userDataResolver = resolve<User, HookContext<UserService>>({
  // email: async (email) => {
  //   // Access the 'users' service
  //   const userService = app.service('users')

  //   // Check if the email already exists in the database
  //   const existingUser = await userService.find({
  //     query: {
  //       email: email,
  //       $limit: 1 // Limit to one result to optimize performance
  //     },
  //     paginate: false // Disable pagination to simplify the query
  //   })

  //   // If the email exists, throw an error
  //   if (existingUser.length > 0) throw new Conflict('Email already exists')

  //   // If no existing user was found, allow the data to pass through
  //   return email
  // },
  // phoneNumber: async (value: any, data: any) => {
  //   // Access the 'users' service
  //   const userService = app.service('users')

  //   // Check if the email already exists in the database
  //   const existingUser: any = await userService.find({
  //     query: {
  //       phoneNumber: data?.phone.trim(),
  //       $limit: 1 // Limit to one result to optimize performance
  //     },
  //     paginate: false // Disable pagination to simplify the query
  //   })

  //   // If the email exists, throw an error
  //   if (existingUser.length > 0) throw new Conflict('PhoneNumber already exists')

  //   // If no existing user was found, allow the data to pass through
  //   return data?.phone
  // },
  password: passwordHash({ strategy: 'credentials-consumer' })
})

// Schema for updating existing entries
export const userPatchSchema = Type.Partial(userSchema, {
  $id: 'UserPatch'
})
export type UserPatch = Static<typeof userPatchSchema>
export const userPatchValidator = getValidator(userPatchSchema, dataValidator)
export const userPatchResolver = resolve<User, HookContext<UserService>>({
  password: passwordHash({ strategy: 'credentials-consumer' })
})

// Schema for allowed query properties
export const userQueryProperties = Type.Pick(userSchema, [
  '_id',
  'email',
  'password',
  'googleId',
  'phoneNumber',
  'accountVerified',
  'tempPhoneNumber',
  'phoneOtp',
  'phoneOtpValidTill',
  'passwordResetToken',
  'passwordResetTokenExpiry',
  'dateOfBirth',
  'gender',
  'height',
  'weight',
  'createdAt',
  'updatedAt',
  'hasDavaoneMembership',
  'davaoneMembership',
  'davaCoinsBalance',
  'profileToken',
  'profileTokenValidTill',
  'identifierType',
  'isWeb',
  'referralCode',
  'referral'
])
export const userQuerySchema = Type.Intersect(
  [
    querySyntax(userQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: true })
  ],
  { additionalProperties: true }
)
export type UserQuery = Static<typeof userQuerySchema>
export const userQueryValidator = getValidator(userQuerySchema, queryValidator)
export const userQueryResolver = resolve<UserQuery, HookContext<UserService>>({
  // If there is a user (e.g. with authentication), they are only allowed to see their own data
  _id: async (value, user, context) => {
    if (context.params.user) {
      return context.params.user._id
    }

    return value
  }
})

// Mongoose model
export const usersDb = Type.Pick(
  userSchema,
  [
    'email',
    'password',
    'googleId',
    'phoneNumber',
    'accountVerified',
    'tempPhoneNumber',
    'phoneOtp',
    'phoneOtpValidTill',
    'name',
    'passwordResetToken',
    'passwordResetTokenExpiry',
    'dateOfBirth',
    'gender',
    'height',
    'weight',
    'createdAt',
    'updatedAt',
    'hasDavaoneMembership',
    'davaoneMembership',
    'davaCoinsBalance',
    'profileToken',
    'profileTokenValidTill',
    'identifierType',
    'isWeb',
    'referralCode',
    'referral'
  ],
  {
    $id: 'UserDb'
  }
)
export type usersDbType = Static<typeof usersDb>
const mongooseSchema = typeboxToMongooseSchema(usersDb)
export const UsersModel = makeMongooseModel('users', mongooseSchema)
