// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { StoresService } from './stores.class'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const storesSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    storeCode: Type.String(),
    storeName: Type.String(),
    gstNumber: Type.String(),
    fssaiNumber: Type.Optional(Type.String()),
    licenceNumber: Type.String(),
    email: Type.String({ mongoose: { unique: true, lowercase: true, trim: true } }),
    phoneNumber: Type.String(),
    address: Type.Optional(Type.String()),
    city: Type.String(),
    state: Type.String(),
    pincode: Type.String(),
    country: Type.Optional(Type.String()),
    serviceableZip: Type.Array(Type.Number()),
    isVerified: Type.String(),
    createdAt: Type.String(),
    updatedAt: Type.String(),
    paginate: Type.Boolean(),
    searchText: Type.String(),
    query: Type.Any(),
    storeSettings: Type.Optional(
      Type.Object({
        low_stock_threshold: Type.Number(),
        out_of_stock_threshold: Type.Number(),
        low_stock_threshold_status: Type.Boolean(),
        out_of_stock_threshold_status: Type.Boolean(),
        assignee: Type.Array(Type.Any())
      })
    ),
    storeId: Type.String(),
    active: Type.Boolean(),
    acceptedInvitation: Type.Boolean(),
    deleted: Type.Boolean(),
    logistics: Type.Optional(Type.Record(Type.String(), Type.Any())),
    coordinates: Type.Optional(Type.Any())
  },
  { $id: 'Stores', additionalProperties: false }
)
export type Stores = Static<typeof storesSchema>
export const storesValidator = getValidator(storesSchema, dataValidator)
export const storesResolver = resolve<Stores, HookContext<StoresService>>({})

export const storesExternalResolver = resolve<Stores, HookContext<StoresService>>({})

// Schema for creating new entries
export const storesDataSchema = Type.Omit(
  storesSchema,
  [
    '_id',
    'isVerified',
    'createdAt',
    'updatedAt',
    'paginate',
    'searchText',
    'query',
    'isVerified',
    'storeId',
    'active',
    'acceptedInvitation',
    'deleted'
  ],
  {
    $id: 'StoresData'
  }
)
export type StoresData = Static<typeof storesDataSchema>
export const storesDataValidator = getValidator(storesDataSchema, dataValidator)
export const storesDataResolver = resolve<Stores, HookContext<StoresService>>({})

// Schema for updating existing entries
export const storesPatchSchema = Type.Partial(storesSchema, {
  $id: 'StoresPatch'
})
export type StoresPatch = Static<typeof storesPatchSchema>
export const storesPatchValidator = getValidator(storesPatchSchema, dataValidator)
export const storesPatchResolver = resolve<Stores, HookContext<StoresService>>({})

// Schema for allowed query properties
export const storesQueryProperties = Type.Pick(storesSchema, [
  'storeName',
  'query',
  'serviceableZip',
  '_id',
  'gstNumber',
  'email',
  'licenceNumber',
  'city',
  'active',
  'acceptedInvitation',
  'pincode',
  'storeCode',
  'deleted'
])
export const storesQuerySchema = Type.Intersect(
  [
    querySyntax(storesQueryProperties, {
      serviceableZip: {
        $gte: Type.Optional(Type.Number()),
        $lte: Type.Optional(Type.Number()),
        $regex: Type.Optional(Type.String()),
        $options: Type.Optional(Type.String()),
        $and: Type.Optional(Type.Any()),
        $eq: Type.Optional(Type.Any()),
        $elemMatch: Type.Object({ $eq: Type.Number() })
      },
      storeName: {
        $regex: Type.String(),
        $options: Type.String()
      },
      gstNumber: {
        $regex: Type.String(),
        $options: Type.String()
      },
      email: {
        $regex: Type.String(),
        $options: Type.String()
      },
      licenceNumber: {
        $regex: Type.String(),
        $options: Type.String()
      },
      city: {
        $regex: Type.String(),
        $options: Type.String()
      },
      pincode: {
        $regex: Type.String(),
        $options: Type.String()
      },
      storeCode: {
        $regex: Type.String(),
        $options: Type.String()
      }
    }),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: true }
)
export type StoresQuery = Static<typeof storesQuerySchema>
export const storesQueryValidator = getValidator(storesQuerySchema, queryValidator)
export const storesQueryResolver = resolve<StoresQuery, HookContext<StoresService>>({})

// mongoose model
const storesDb = Type.Omit(storesSchema, ['_id', 'paginate', 'query'], { $id: 'StoreDb' })

const mongooseSchema = typeboxToMongooseSchema(storesDb)

mongooseSchema.virtual('storeUser', {
  ref: 'store-admin-users',
  localField: 'email',
  foreignField: 'email',
  justOne: true
})

export const StoreModel = makeMongooseModel('stores', mongooseSchema)
