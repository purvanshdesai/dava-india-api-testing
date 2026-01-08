// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { StorePharmacistService } from './store-pharmacist.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const storePharmacistSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    name: Type.String(),
    employeeId: Type.String(),
    phoneNumber: Type.String(),
    pin: Type.String(),
    store: Type.Optional(ModelObjectId({ mongoose: { ref: 'stores' } })),
    archive: Type.Optional(Type.Boolean())
  },
  { $id: 'StorePharmacist', additionalProperties: false }
)
export type StorePharmacist = Static<typeof storePharmacistSchema>
export const storePharmacistValidator = getValidator(storePharmacistSchema, dataValidator)
export const storePharmacistResolver = resolve<StorePharmacist, HookContext<StorePharmacistService>>({})

export const storePharmacistExternalResolver = resolve<StorePharmacist, HookContext<StorePharmacistService>>(
  {}
)

// Schema for creating new entries
export const storePharmacistDataSchema = Type.Pick(
  storePharmacistSchema,
  ['name', 'employeeId', 'phoneNumber', 'pin', 'store', 'archive'],
  {
    $id: 'StorePharmacistData'
  }
)
export type StorePharmacistData = Static<typeof storePharmacistDataSchema>
export const storePharmacistDataValidator = getValidator(storePharmacistDataSchema, dataValidator)
export const storePharmacistDataResolver = resolve<StorePharmacist, HookContext<StorePharmacistService>>({})

// Schema for updating existing entries
export const storePharmacistPatchSchema = Type.Partial(storePharmacistSchema, {
  $id: 'StorePharmacistPatch'
})
export type StorePharmacistPatch = Static<typeof storePharmacistPatchSchema>
export const storePharmacistPatchValidator = getValidator(storePharmacistPatchSchema, dataValidator)
export const storePharmacistPatchResolver = resolve<StorePharmacist, HookContext<StorePharmacistService>>({})

// Schema for allowed query properties
export const storePharmacistQueryProperties = Type.Pick(storePharmacistSchema, [
  '_id',
  'name',
  'employeeId',
  'phoneNumber',
  'pin',
  'store',
  'archive'
])
export const storePharmacistQuerySchema = Type.Intersect(
  [
    querySyntax(storePharmacistQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type StorePharmacistQuery = Static<typeof storePharmacistQuerySchema>
export const storePharmacistQueryValidator = getValidator(storePharmacistQuerySchema, queryValidator)
export const storePharmacistQueryResolver = resolve<
  StorePharmacistQuery,
  HookContext<StorePharmacistService>
>({})

export const StorePharmacistDb = Type.Pick(
  storePharmacistSchema,
  ['name', 'employeeId', 'phoneNumber', 'pin', 'store', 'archive'],
  {
    $id: 'StorePharmacistDb'
  }
)

const mongooseSchema = typeboxToMongooseSchema(StorePharmacistDb)
export const StorePharmacistModel = makeMongooseModel('store-pharmacist', mongooseSchema)
