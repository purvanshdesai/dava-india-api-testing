// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../../../declarations'
import { dataValidator, queryValidator } from '../../../../validators'
import type { VariationsService } from './variations.class'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../../../utils/mongoose'

// Main data model schema
export const variationsSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    variationCategories: Type.Optional(Type.Array(Type.String())),
    variationCategoryValues: Type.Optional(Type.Object({})),
    getProducts: Type.Optional(Type.Boolean()),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
  },
  { $id: 'Variations', additionalProperties: true }
)
export type Variations = Static<typeof variationsSchema>
export const variationsValidator = getValidator(variationsSchema, dataValidator)
export const variationsResolver = resolve<Variations, HookContext<VariationsService>>({})

export const variationsExternalResolver = resolve<Variations, HookContext<VariationsService>>({})

// Schema for creating new entries
export const variationsDataSchema = Type.Pick(
  variationsSchema,
  ['variationCategories', 'variationCategoryValues', 'createdAt', 'updatedAt'],
  {
    $id: 'VariationsData'
  }
)
export type VariationsData = Static<typeof variationsDataSchema>
export const variationsDataValidator = getValidator(variationsDataSchema, dataValidator)
export const variationsDataResolver = resolve<Variations, HookContext<VariationsService>>({})

// Schema for updating existing entries
export const variationsPatchSchema = Type.Partial(variationsSchema, {
  $id: 'VariationsPatch'
})
export type VariationsPatch = Static<typeof variationsPatchSchema>
export const variationsPatchValidator = getValidator(variationsPatchSchema, dataValidator)
export const variationsPatchResolver = resolve<Variations, HookContext<VariationsService>>({})

// Schema for allowed query properties
export const variationsQueryProperties = Type.Pick(variationsSchema, ['getProducts'])
export const variationsQuerySchema = Type.Intersect(
  [
    querySyntax(variationsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: true })
  ],
  { additionalProperties: true }
)
export type VariationsQuery = Static<typeof variationsQuerySchema>
export const variationsQueryValidator = getValidator(variationsQuerySchema, queryValidator)
export const variationsQueryResolver = resolve<VariationsQuery, HookContext<VariationsService>>({})

export const variationsDb = Type.Pick(
  variationsSchema,
  ['variationCategories', 'variationCategoryValues', 'createdAt', 'updatedAt'],
  { $id: 'VariationsDb' }
)
export type VariationsDbType = Static<typeof variationsDb>
const mongooseSchema = typeboxToMongooseSchema(variationsDb)
export const VariationsModel = makeMongooseModel('product-variations', mongooseSchema)
