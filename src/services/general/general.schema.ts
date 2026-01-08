// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { GeneralService } from './general.class'

// Main data model schema
export const generalSchema = Type.Object(
  {
    sharingMedium: Type.Optional(Type.String()),
    shareWith: Type.Optional(Type.String())
  },
  { $id: 'General', additionalProperties: false }
)
export type General = Static<typeof generalSchema>
export const generalValidator = getValidator(generalSchema, dataValidator)
export const generalResolver = resolve<General, HookContext<GeneralService>>({})

export const generalExternalResolver = resolve<General, HookContext<GeneralService>>({})

// Schema for creating new entries
export const generalDataSchema = Type.Pick(generalSchema, ['sharingMedium', 'shareWith'], {
  $id: 'GeneralData'
})
export type GeneralData = Static<typeof generalDataSchema>
export const generalDataValidator = getValidator(generalDataSchema, dataValidator)
export const generalDataResolver = resolve<General, HookContext<GeneralService>>({})

// Schema for updating existing entries
export const generalPatchSchema = Type.Partial(generalSchema, {
  $id: 'GeneralPatch'
})
export type GeneralPatch = Static<typeof generalPatchSchema>
export const generalPatchValidator = getValidator(generalPatchSchema, dataValidator)
export const generalPatchResolver = resolve<General, HookContext<GeneralService>>({})

// Schema for allowed query properties
export const generalQueryProperties = Type.Pick(generalSchema, [])
export const generalQuerySchema = Type.Intersect(
  [
    querySyntax(generalQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type GeneralQuery = Static<typeof generalQuerySchema>
export const generalQueryValidator = getValidator(generalQuerySchema, queryValidator)
export const generalQueryResolver = resolve<GeneralQuery, HookContext<GeneralService>>({})
