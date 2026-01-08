// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { UserAddressesService } from './user-addresses.class'
import { ModelObjectId } from '../../utils'
import { typeboxToMongooseSchema, makeMongooseModel } from '../../utils/mongoose'

// Main data model schema
export const userAddressesSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    userId: ModelObjectId({ mongoose: { ref: 'users' } }),
    userName: Type.String(),
    addressLine1: Type.String(),
    addressLine2: Type.Optional(Type.String()),
    city: Type.String(),
    state: Type.String(),
    country: Type.String(),
    postalCode: Type.String(),
    phoneNumber: Type.String(),
    alternatePhoneNumber: Type.Optional(Type.String()),
    isDefault: Type.Boolean({ default: false }),
    type: Type.Optional(Type.String()),
    fullAddress: Type.Optional(Type.String()),
    coordinates: Type.Optional(
      Type.Object({
        latitude: Type.Optional(Type.Number()),
        longitude: Type.Optional(Type.Number())
      })
    )
  },
  { $id: 'UserAddresses', additionalProperties: false }
)
export type UserAddresses = Static<typeof userAddressesSchema>
export const userAddressesValidator = getValidator(userAddressesSchema, dataValidator)
export const userAddressesResolver = resolve<UserAddresses, HookContext<UserAddressesService>>({})

export const userAddressesExternalResolver = resolve<UserAddresses, HookContext<UserAddressesService>>({})

// Schema for creating new entries
export const userAddressesDataSchema = Type.Pick(
  userAddressesSchema,
  [
    'userId',
    'userName',
    'addressLine1',
    'addressLine2',
    'city',
    'state',
    'country',
    'postalCode',
    'phoneNumber',
    'alternatePhoneNumber',
    'isDefault',
    'type',
    'coordinates',
    'fullAddress'
  ],
  {
    $id: 'UserAddressesData'
  }
)
export type UserAddressesData = Static<typeof userAddressesDataSchema>
export const userAddressesDataValidator = getValidator(userAddressesDataSchema, dataValidator)
export const userAddressesDataResolver = resolve<UserAddresses, HookContext<UserAddressesService>>({})

// Schema for updating existing entries
export const userAddressesPatchSchema = Type.Partial(userAddressesSchema, {
  $id: 'UserAddressesPatch'
})
export type UserAddressesPatch = Static<typeof userAddressesPatchSchema>
export const userAddressesPatchValidator = getValidator(userAddressesPatchSchema, dataValidator)
export const userAddressesPatchResolver = resolve<UserAddresses, HookContext<UserAddressesService>>({})

// Schema for allowed query properties
export const userAddressesQueryProperties = Type.Pick(userAddressesSchema, [
  '_id',
  'userId',
  'userName',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'country',
  'postalCode',
  'phoneNumber',
  'alternatePhoneNumber',
  'isDefault',
  'type',
  'coordinates',
  'fullAddress'
])
export const userAddressesQuerySchema = Type.Intersect(
  [
    querySyntax(userAddressesQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type UserAddressesQuery = Static<typeof userAddressesQuerySchema>
export const userAddressesQueryValidator = getValidator(userAddressesQuerySchema, queryValidator)
export const userAddressesQueryResolver = resolve<UserAddressesQuery, HookContext<UserAddressesService>>({})

export const addressDb = Type.Pick(
  userAddressesSchema,
  [
    'userId',
    'userName',
    'addressLine1',
    'addressLine2',
    'city',
    'state',
    'country',
    'postalCode',
    'phoneNumber',
    'alternatePhoneNumber',
    'isDefault',
    'type',
    'coordinates',
    'fullAddress'
  ],
  {
    $id: 'userAddressDb'
  }
)

const mongooseSchema = typeboxToMongooseSchema(addressDb)

export const userAddressModel = makeMongooseModel('user-addresses', mongooseSchema)
