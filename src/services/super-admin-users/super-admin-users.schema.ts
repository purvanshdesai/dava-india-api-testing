// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { SuperAdminUsersService } from './super-admin-users.class'
import { passwordHash } from '@feathersjs/authentication-local'
import { app } from '../../app'
import { Conflict } from '@feathersjs/errors'
import { ModelObjectId } from '../../utils/typebox'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const superAdminUsersSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    name: Type.Optional(Type.String()),
    email: Type.Optional(Type.String({ format: 'email' })),
    phoneNumber: Type.Optional(Type.String()),
    password: Type.Optional(Type.String()),
    role: ModelObjectId({ mongoose: { ref: 'roles' } }),
    isActive: Type.Boolean({ default: true }),
    otp: Type.Optional(Type.String()),
    otpValidTill: Type.Optional(Type.String({ format: 'date-time' })),
    passwordResetToken: Type.String(),
    passwordResetTokenExpiry: Type.String({ format: 'date-time' }),
    createdAt: Type.String({ format: 'date-time' }),
    archive: Type.Optional(Type.Boolean({ default: false })),
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
  { $id: 'SuperAdminUsers', additionalProperties: true }
)
export type SuperAdminUsers = Static<typeof superAdminUsersSchema>
export const superAdminUsersValidator = getValidator(superAdminUsersSchema, dataValidator)
export const superAdminUsersResolver = resolve<SuperAdminUsers, HookContext<SuperAdminUsersService>>({})

export const superAdminUsersExternalResolver = resolve<SuperAdminUsers, HookContext<SuperAdminUsersService>>({
  // The password should never be visible externally
  password: async () => undefined
})

// Schema for creating new entries
export const superAdminUsersDataSchema = Type.Pick(
  superAdminUsersSchema,
  ['name', 'email', 'password', 'phoneNumber', 'role', 'isActive', 'createdAt', 'archive', 'extraAttr'],
  {
    $id: 'SuperAdminUsersData'
  }
)
export type SuperAdminUsersData = Static<typeof superAdminUsersDataSchema>
export const superAdminUsersDataValidator = getValidator(superAdminUsersDataSchema, dataValidator)
export const superAdminUsersDataResolver = resolve<SuperAdminUsers, HookContext<SuperAdminUsersService>>({
  email: async (email) => {
    // Access the 'users' service
    const userService = app.service('super-admin-users')

    // Check if the email already exists in the database
    const existingUser = await userService.find({
      query: {
        email: email,
        $limit: 1 // Limit to one result to optimize performance
      },
      paginate: false // Disable pagination to simplify the query
    })

    // If the email exists, throw an error
    if (existingUser.length > 0) throw new Conflict('Email already exists')

    // If no existing user was found, allow the data to pass through
    return email
  },
  phoneNumber: async (value) => {
    // Access the 'users' service
    const userService = app.service('super-admin-users')

    // Check if the email already exists in the database
    const existingUser = await userService.find({
      query: {
        phoneNumber: value,
        $limit: 1 // Limit to one result to optimize performance
      },
      paginate: false // Disable pagination to simplify the query
    })

    // If the email exists, throw an error
    if (existingUser.length > 0) throw new Conflict('PhoneNumber already exists')

    // If no existing user was found, allow the data to pass through
    return value
  },
  password: passwordHash({ service: 'super-admin/authentication', strategy: 'credentials-super-admin' })
})

// Schema for updating existing entries
export const superAdminUsersPatchSchema = Type.Partial(superAdminUsersSchema, {
  $id: 'SuperAdminUsersPatch'
})
export type SuperAdminUsersPatch = Static<typeof superAdminUsersPatchSchema>
export const superAdminUsersPatchValidator = getValidator(superAdminUsersPatchSchema, dataValidator)
export const superAdminUsersPatchResolver = resolve<SuperAdminUsers, HookContext<SuperAdminUsersService>>({
  password: passwordHash({ service: 'super-admin/authentication', strategy: 'credentials-super-admin' })
})

// Schema for allowed query properties
export const superAdminUsersQueryProperties = Type.Pick(superAdminUsersSchema, [
  '_id',
  'name',
  'email',
  'password',
  'phoneNumber',
  'role',
  'isActive',
  'createdAt',
  'archive',
  'extraAttr'
])
export const superAdminUsersQuerySchema = Type.Intersect(
  [
    querySyntax(superAdminUsersQueryProperties, {
      email: { $regex: Type.String(), $options: Type.String() }
    }),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: true })
  ],
  { additionalProperties: true }
)
export type SuperAdminUsersQuery = Static<typeof superAdminUsersQuerySchema>
export const superAdminUsersQueryValidator = getValidator(superAdminUsersQuerySchema, queryValidator)
export const superAdminUsersQueryResolver = resolve<
  SuperAdminUsersQuery,
  HookContext<SuperAdminUsersService>
>({})

// Mongoose model
export const usersDb = Type.Pick(
  superAdminUsersSchema,
  [
    'name',
    'email',
    'password',
    'phoneNumber',
    'role',
    'isActive',
    'otp',
    'otpValidTill',
    'passwordResetToken',
    'passwordResetTokenExpiry',
    'createdAt',
    'archive',
    'extraAttr'
  ],
  {
    $id: 'superAdminUsersDb'
  }
)
export type usersDbType = Static<typeof usersDb>
const mongooseSchema = typeboxToMongooseSchema(usersDb)
export const SuperAdminUsersModel = makeMongooseModel('super-admin-users', mongooseSchema)
