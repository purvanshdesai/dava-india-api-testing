// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { AnalyticsTrackerHistoryService } from './analytics-tracker-history.class'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const analyticsTrackerHistorySchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    provider: Type.String(),
    event: Type.String(),
    payload: Type.String(),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
  },
  { $id: 'AnalyticsTrackerHistory', additionalProperties: false }
)
export type AnalyticsTrackerHistory = Static<typeof analyticsTrackerHistorySchema>
export const analyticsTrackerHistoryValidator = getValidator(analyticsTrackerHistorySchema, dataValidator)
export const analyticsTrackerHistoryResolver = resolve<
  AnalyticsTrackerHistory,
  HookContext<AnalyticsTrackerHistoryService>
>({})

export const analyticsTrackerHistoryExternalResolver = resolve<
  AnalyticsTrackerHistory,
  HookContext<AnalyticsTrackerHistoryService>
>({})

// Schema for creating new entries
export const analyticsTrackerHistoryDataSchema = Type.Pick(
  analyticsTrackerHistorySchema,
  ['provider', 'event', 'payload'],
  {
    $id: 'AnalyticsTrackerHistoryData'
  }
)
export type AnalyticsTrackerHistoryData = Static<typeof analyticsTrackerHistoryDataSchema>
export const analyticsTrackerHistoryDataValidator = getValidator(
  analyticsTrackerHistoryDataSchema,
  dataValidator
)
export const analyticsTrackerHistoryDataResolver = resolve<
  AnalyticsTrackerHistory,
  HookContext<AnalyticsTrackerHistoryService>
>({})

// Schema for updating existing entries
export const analyticsTrackerHistoryPatchSchema = Type.Partial(analyticsTrackerHistorySchema, {
  $id: 'AnalyticsTrackerHistoryPatch'
})
export type AnalyticsTrackerHistoryPatch = Static<typeof analyticsTrackerHistoryPatchSchema>
export const analyticsTrackerHistoryPatchValidator = getValidator(
  analyticsTrackerHistoryPatchSchema,
  dataValidator
)
export const analyticsTrackerHistoryPatchResolver = resolve<
  AnalyticsTrackerHistory,
  HookContext<AnalyticsTrackerHistoryService>
>({})

// Schema for allowed query properties
export const analyticsTrackerHistoryQueryProperties = Type.Pick(analyticsTrackerHistorySchema, [
  '_id',
  'provider',
  'event',
  'payload'
])
export const analyticsTrackerHistoryQuerySchema = Type.Intersect(
  [
    querySyntax(analyticsTrackerHistoryQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type AnalyticsTrackerHistoryQuery = Static<typeof analyticsTrackerHistoryQuerySchema>
export const analyticsTrackerHistoryQueryValidator = getValidator(
  analyticsTrackerHistoryQuerySchema,
  queryValidator
)
export const analyticsTrackerHistoryQueryResolver = resolve<
  AnalyticsTrackerHistoryQuery,
  HookContext<AnalyticsTrackerHistoryService>
>({})

export const analyticsTrackerHistorySchemaDb = Type.Omit(analyticsTrackerHistorySchema, ['_id'], {
  $id: 'analyticsTrackerHistorySchemaDb'
})

const mongooseSchema = typeboxToMongooseSchema(analyticsTrackerHistorySchemaDb)

export const AnalyticsTrackerHistorySchemaModel = makeMongooseModel(
  'analytics-tracker-history',
  mongooseSchema
)
