// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { CollectionsService } from './collections.class'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const collectionsSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    name: Type.String(),
    description: Type.String(),
    image: Type.Any(),
    slugUrl: Type.String(),
    isActive: Type.Boolean(),
    translations: Type.Any(),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' })),
    $paginate: Type.Optional(Type.Boolean()),
    query: Type.Any()
  },
  { $id: 'Collections', additionalProperties: false }
)
export type Collections = Static<typeof collectionsSchema>
export const collectionsValidator = getValidator(collectionsSchema, dataValidator)
export const collectionsResolver = resolve<Collections, HookContext<CollectionsService>>({})

export const collectionsExternalResolver = resolve<Collections, HookContext<CollectionsService>>({})

// Schema for creating new entries
export const collectionsDataSchema = Type.Pick(
  collectionsSchema,
  ['name', 'description', 'image', 'slugUrl', 'isActive', 'translations', 'createdAt', 'updatedAt'],
  {
    $id: 'CollectionsData'
  }
)
export type CollectionsData = Static<typeof collectionsDataSchema>
export const collectionsDataValidator = getValidator(collectionsDataSchema, dataValidator)
export const collectionsDataResolver = resolve<Collections, HookContext<CollectionsService>>({})

// Schema for updating existing entries
export const collectionsPatchSchema = Type.Partial(collectionsSchema, {
  $id: 'CollectionsPatch'
})
export type CollectionsPatch = Static<typeof collectionsPatchSchema>
export const collectionsPatchValidator = getValidator(collectionsPatchSchema, dataValidator)
export const collectionsPatchResolver = resolve<Collections, HookContext<CollectionsService>>({})

// Schema for allowed query properties
export const collectionsQueryProperties = Type.Pick(collectionsSchema, ['query', '$paginate'])
export const collectionsQuerySchema = Type.Intersect(
  [
    querySyntax(collectionsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: true }
)
export type CollectionsQuery = Static<typeof collectionsQuerySchema>
export const collectionsQueryValidator = getValidator(collectionsQuerySchema, queryValidator)
export const collectionsQueryResolver = resolve<CollectionsQuery, HookContext<CollectionsService>>({})

export const CollectionsDb = Type.Omit(collectionsSchema, ['_id', 'query'], { $id: 'CollectionDb' })

export type TCollectionDb = Static<typeof collectionsDataSchema>

const mongooseSchema = typeboxToMongooseSchema(CollectionsDb)
export const CollectionModel = makeMongooseModel('collections', mongooseSchema)
