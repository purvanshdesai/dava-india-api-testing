// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { DavaCoinsHistoryService } from './dava-coins-history.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const davaCoinsHistorySchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    user: ModelObjectId({ mongoose: { ref: 'users' } }),
    orderId: Type.String(),
    usageType: StringEnum(['credit', 'debit']),
    coins: Type.Number(),
    description: Type.String(),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' })
  },
  { $id: 'DavaCoinsHistory', additionalProperties: false }
)
export type DavaCoinsHistory = Static<typeof davaCoinsHistorySchema>
export const davaCoinsHistoryValidator = getValidator(davaCoinsHistorySchema, dataValidator)
export const davaCoinsHistoryResolver = resolve<DavaCoinsHistory, HookContext<DavaCoinsHistoryService>>({})

export const davaCoinsHistoryExternalResolver = resolve<
  DavaCoinsHistory,
  HookContext<DavaCoinsHistoryService>
>({})

// Schema for creating new entries
export const davaCoinsHistoryDataSchema = Type.Pick(
  davaCoinsHistorySchema,
  ['user', 'orderId', 'coins', 'description', 'usageType', 'createdAt', 'updatedAt'],
  {
    $id: 'DavaCoinsHistoryData'
  }
)
export type DavaCoinsHistoryData = Static<typeof davaCoinsHistoryDataSchema>
export const davaCoinsHistoryDataValidator = getValidator(davaCoinsHistoryDataSchema, dataValidator)
export const davaCoinsHistoryDataResolver = resolve<DavaCoinsHistory, HookContext<DavaCoinsHistoryService>>(
  {}
)

// Schema for updating existing entries
export const davaCoinsHistoryPatchSchema = Type.Partial(davaCoinsHistorySchema, {
  $id: 'DavaCoinsHistoryPatch'
})
export type DavaCoinsHistoryPatch = Static<typeof davaCoinsHistoryPatchSchema>
export const davaCoinsHistoryPatchValidator = getValidator(davaCoinsHistoryPatchSchema, dataValidator)
export const davaCoinsHistoryPatchResolver = resolve<DavaCoinsHistory, HookContext<DavaCoinsHistoryService>>(
  {}
)

// Schema for allowed query properties
export const davaCoinsHistoryQueryProperties = Type.Pick(davaCoinsHistorySchema, [
  '_id',
  'user',
  'orderId',
  'coins',
  'description',
  'usageType',
  'createdAt',
  'updatedAt'
])
export const davaCoinsHistoryQuerySchema = Type.Intersect(
  [
    querySyntax(davaCoinsHistoryQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type DavaCoinsHistoryQuery = Static<typeof davaCoinsHistoryQuerySchema>
export const davaCoinsHistoryQueryValidator = getValidator(davaCoinsHistoryQuerySchema, queryValidator)
export const davaCoinsHistoryQueryResolver = resolve<
  DavaCoinsHistoryQuery,
  HookContext<DavaCoinsHistoryService>
>({})

export const DavaCoinsHistoryDb = Type.Omit(davaCoinsHistorySchema, ['_id'], {
  $id: 'DavaCoinsHistoryDb'
})

const mongooseSchema = typeboxToMongooseSchema(DavaCoinsHistoryDb)
export const DavaCoinsHistoryModel = makeMongooseModel('dava-coins-history', mongooseSchema)
