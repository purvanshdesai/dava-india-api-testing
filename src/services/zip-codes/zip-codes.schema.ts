// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { ZipCodesService } from './zip-codes.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const zipCodesSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    zipCode: Type.String({ mongoose: { index: true } }),
    area: Type.String(),
    district: Type.String(),
    state: Type.String(),
    location: Type.Object({ type: Type.String(), coordinates: Type.Array(Type.Number()) }),
    isDeliverable: Type.Boolean({ default: false })
  },
  { $id: 'ZipCodes', additionalProperties: false }
)
export type ZipCodes = Static<typeof zipCodesSchema>
export const zipCodesValidator = getValidator(zipCodesSchema, dataValidator)
export const zipCodesResolver = resolve<ZipCodes, HookContext<ZipCodesService>>({})

export const zipCodesExternalResolver = resolve<ZipCodes, HookContext<ZipCodesService>>({})

// Schema for creating new entries
export const zipCodesDataSchema = Type.Pick(
  zipCodesSchema,
  ['zipCode', 'area', 'district', 'state', 'location', 'isDeliverable'],
  {
    $id: 'ZipCodesData'
  }
)
export type ZipCodesData = Static<typeof zipCodesDataSchema>
export const zipCodesDataValidator = getValidator(zipCodesDataSchema, dataValidator)
export const zipCodesDataResolver = resolve<ZipCodes, HookContext<ZipCodesService>>({})

// Schema for updating existing entries
export const zipCodesPatchSchema = Type.Partial(zipCodesSchema, {
  $id: 'ZipCodesPatch'
})
export type ZipCodesPatch = Static<typeof zipCodesPatchSchema>
export const zipCodesPatchValidator = getValidator(zipCodesPatchSchema, dataValidator)
export const zipCodesPatchResolver = resolve<ZipCodes, HookContext<ZipCodesService>>({})

// Schema for allowed query properties
export const zipCodesQueryProperties = Type.Pick(zipCodesSchema, ['_id', 'zipCode', 'district', 'state'])
export const zipCodesQuerySchema = Type.Intersect(
  [
    querySyntax(zipCodesQueryProperties, {
      zipCode: {
        $in: Type.Optional(Type.Array(Type.Number())),
        $gte: Type.Optional(Type.Number()),
        $lte: Type.Optional(Type.Number()),
        $regex: Type.Optional(Type.String()),
        $options: Type.Optional(Type.String())
      },
      district: {
        $regex: Type.Optional(Type.String()),
        $options: Type.Optional(Type.String())
      },
      state: {
        $regex: Type.Optional(Type.String()),
        $options: Type.Optional(Type.String())
      }
    }),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: true }
)
export type ZipCodesQuery = Static<typeof zipCodesQuerySchema>
export const zipCodesQueryValidator = getValidator(zipCodesQuerySchema, queryValidator)
export const zipCodesQueryResolver = resolve<ZipCodesQuery, HookContext<ZipCodesService>>({})

export const ZipCodesDb = Type.Omit(zipCodesSchema, ['_id'], {
  $id: 'ZipCodesDb'
})

const mongooseSchema = typeboxToMongooseSchema(ZipCodesDb)
export const ZipCodesModel = makeMongooseModel('zip-codes', mongooseSchema)
