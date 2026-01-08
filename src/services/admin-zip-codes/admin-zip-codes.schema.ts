// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { AdminZipCodesService } from './admin-zip-codes.class'

// Main data model schema
export const adminZipCodesSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    text: Type.Optional(Type.String())
  },
  { $id: 'AdminZipCodes', additionalProperties: true }
)
export type AdminZipCodes = Static<typeof adminZipCodesSchema>
export const adminZipCodesValidator = getValidator(adminZipCodesSchema, dataValidator)
export const adminZipCodesResolver = resolve<AdminZipCodes, HookContext<AdminZipCodesService>>({})

export const adminZipCodesExternalResolver = resolve<AdminZipCodes, HookContext<AdminZipCodesService>>({})

// Schema for creating new entries
export const adminZipCodesDataSchema = Type.Pick(adminZipCodesSchema, ['text'], {
  $id: 'AdminZipCodesData'
})
export type AdminZipCodesData = Static<typeof adminZipCodesDataSchema>
export const adminZipCodesDataValidator = getValidator(adminZipCodesDataSchema, dataValidator)
export const adminZipCodesDataResolver = resolve<AdminZipCodes, HookContext<AdminZipCodesService>>({})

// Schema for updating existing entries
export const adminZipCodesPatchSchema = Type.Partial(adminZipCodesSchema, {
  $id: 'AdminZipCodesPatch'
})
export type AdminZipCodesPatch = Static<typeof adminZipCodesPatchSchema>
export const adminZipCodesPatchValidator = getValidator(adminZipCodesPatchSchema, dataValidator)
export const adminZipCodesPatchResolver = resolve<AdminZipCodes, HookContext<AdminZipCodesService>>({})

// Schema for allowed query properties
export const adminZipCodesQueryProperties = Type.Pick(adminZipCodesSchema, ['_id', 'text'])
export const adminZipCodesQuerySchema = Type.Intersect(
  [
    querySyntax(adminZipCodesQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: true })
  ],
  { additionalProperties: true }
)
export type AdminZipCodesQuery = Static<typeof adminZipCodesQuerySchema>
export const adminZipCodesQueryValidator = getValidator(adminZipCodesQuerySchema, queryValidator)
export const adminZipCodesQueryResolver = resolve<AdminZipCodesQuery, HookContext<AdminZipCodesService>>({})
