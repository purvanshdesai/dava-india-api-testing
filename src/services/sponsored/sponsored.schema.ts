// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { SponsoredService } from './sponsored.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const sponsoredSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    title: Type.String(),
    type: StringEnum([
      'featured-categories',
      'featured-products',
      'image',
      'carousel',
      'carousel-mini',
      'davaone-membership',
      'generic-medicine-info'
    ]),
    startDate: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
    endDate: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
    isActive: Type.Boolean({ default: true }),

    // featured
    collections: Type.Optional(Type.Array(ModelObjectId({ mongoose: { ref: 'collections' } }))),
    products: Type.Optional(Type.Array(ModelObjectId({ mongoose: { ref: 'products' } }))),
    collection: Type.Optional(Type.Union([ModelObjectId({ mongoose: { ref: 'collections' } }), Type.Null()])),

    properties: Type.Optional(
      Type.Object({
        autoScroll: Type.Optional(Type.Boolean()),
        scrollTime: Type.Optional(Type.Union([Type.Number(), Type.String(), Type.Null()])),
        theme: Type.Optional(Type.String()),
        videoUrl: Type.Optional(Type.String())
      })
    ),
    position: Type.Number({ default: 1 }),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
    translations: Type.Optional(Type.Any())
  },
  { $id: 'Sponsored', additionalProperties: false }
)
export type Sponsored = Static<typeof sponsoredSchema>
export const sponsoredValidator = getValidator(sponsoredSchema, dataValidator)
export const sponsoredResolver = resolve<Sponsored, HookContext<SponsoredService>>({})

export const sponsoredExternalResolver = resolve<Sponsored, HookContext<SponsoredService>>({})

// Schema for creating new entries
export const sponsoredDataSchema = Type.Pick(
  sponsoredSchema,
  [
    'title',
    'type',
    'startDate',
    'endDate',
    'collections',
    'collection',
    'products',
    'properties',
    'isActive',
    'position',
    'createdAt',
    'updatedAt',
    'translations'
  ],
  {
    $id: 'SponsoredData'
  }
)
export type SponsoredData = Static<typeof sponsoredDataSchema>
export const sponsoredDataValidator = getValidator(sponsoredDataSchema, dataValidator)
export const sponsoredDataResolver = resolve<Sponsored, HookContext<SponsoredService>>({})

// Schema for updating existing entries
export const sponsoredPatchSchema = Type.Partial(sponsoredSchema, {
  $id: 'SponsoredPatch'
})
export type SponsoredPatch = Static<typeof sponsoredPatchSchema>
export const sponsoredPatchValidator = getValidator(sponsoredPatchSchema, dataValidator)
export const sponsoredPatchResolver = resolve<Sponsored, HookContext<SponsoredService>>({})

// Schema for allowed query properties
export const sponsoredQueryProperties = Type.Pick(sponsoredSchema, ['_id'])
export const sponsoredQuerySchema = Type.Intersect(
  [
    querySyntax(sponsoredQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type SponsoredQuery = Static<typeof sponsoredQuerySchema>
export const sponsoredQueryValidator = getValidator(sponsoredQuerySchema, queryValidator)
export const sponsoredQueryResolver = resolve<SponsoredQuery, HookContext<SponsoredService>>({})

export const SponsoredDb = Type.Pick(
  sponsoredSchema,
  [
    'type',
    'title',
    'collections',
    'products',
    'collection',
    'startDate',
    'endDate',
    'isActive',
    'properties',
    'position',
    'createdAt',
    'updatedAt',
    'translations'
  ],
  {
    $id: 'SponsoredDb'
  }
)

const mongooseSchema = typeboxToMongooseSchema(SponsoredDb)
export const SponsoredModel = makeMongooseModel('sponsored', mongooseSchema)
