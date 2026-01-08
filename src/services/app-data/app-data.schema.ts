// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { AppDataService } from './app-data.class'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'
import { InferRawDocType } from 'mongoose'

export const CONSTANTS = {
  TYPE: {
    LANGUAGE: 'language',
    TAXES: 'taxes',
    MOLECULE: 'molecule',
    TRACKING_STATUS: 'order-tracking-status',
    STORE_TRANSFER_REASON: 'store-transfer-reason',
    CONSUMPTION: 'consumption',
    ITEM_CANCEL_REASON: 'item-cancel-reason',
    ITEM_RETURN_REASON: 'item-return-reason',
    POLICY: 'policy'
  }
}

// Main data model schema
export const appDataSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    name: Type.String(),
    visibility: Type.Optional(Type.Array(Type.String())),
    type: StringEnum([
      CONSTANTS.TYPE.LANGUAGE,
      CONSTANTS.TYPE.MOLECULE,
      CONSTANTS.TYPE.TRACKING_STATUS,
      CONSTANTS.TYPE.TAXES,
      CONSTANTS.TYPE.STORE_TRANSFER_REASON,
      CONSTANTS.TYPE.CONSUMPTION,
      CONSTANTS.TYPE.ITEM_RETURN_REASON,
      CONSTANTS.TYPE.ITEM_CANCEL_REASON,
      CONSTANTS.TYPE.POLICY
    ]),
    statusCode: Type.Optional(Type.String()),
    description: Type.Optional(Type.String()),
    imageUrl: Type.Optional(Type.String()),
    value: Type.Optional(Type.Any())
  },
  { $id: 'AppData', additionalProperties: true }
)
export type AppData = Static<typeof appDataSchema>
export const appDataValidator = getValidator(appDataSchema, dataValidator)
export const appDataResolver = resolve<AppData, HookContext<AppDataService>>({})

export const appDataExternalResolver = resolve<AppData, HookContext<AppDataService>>({})

// Schema for creating new entries
export const appDataDataSchema = Type.Pick(
  appDataSchema,
  ['name', 'type', 'description', 'imageUrl', 'visibility', 'value'],
  {
    $id: 'AppDataData'
  }
)
export type AppDataData = Static<typeof appDataDataSchema>
export const appDataDataValidator = getValidator(appDataDataSchema, dataValidator)
export const appDataDataResolver = resolve<AppData, HookContext<AppDataService>>({})

// Schema for updating existing entries
export const appDataPatchSchema = Type.Partial(appDataSchema, {
  $id: 'AppDataPatch'
})
export type AppDataPatch = Static<typeof appDataPatchSchema>
export const appDataPatchValidator = getValidator(appDataPatchSchema, dataValidator)
export const appDataPatchResolver = resolve<AppData, HookContext<AppDataService>>({})

// Schema for allowed query properties
export const appDataQueryProperties = Type.Pick(appDataSchema, [
  '_id',
  'name',
  'type',
  'description',
  'imageUrl',
  'visibility',
  'value'
])
export const appDataQuerySchema = Type.Intersect(
  [
    querySyntax(appDataQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type AppDataQuery = Static<typeof appDataQuerySchema>
export const appDataQueryValidator = getValidator(appDataQuerySchema, queryValidator)
export const appDataQueryResolver = resolve<AppDataQuery, HookContext<AppDataService>>({})

export const AppDataDb = Type.Omit(appDataSchema, ['_id'], { $id: 'AppDataDb' })

export type TOrderDb = Static<typeof AppDataDb>

const mongooseSchema = typeboxToMongooseSchema(AppDataDb)

export type TAppDataSchema = InferRawDocType<typeof mongooseSchema>

export const AppDataModel = makeMongooseModel('app-data', mongooseSchema)
