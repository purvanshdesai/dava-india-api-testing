// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { ExportsService } from './exports.class'

// Main data model schema
export const exportsSchema = Type.Object(
  {
    exportFor: Type.String(),
    filters: Type.Optional(Type.Any())
  },
  { $id: 'Exports', additionalProperties: false }
)
export type Exports = Static<typeof exportsSchema>
export const exportsValidator = getValidator(exportsSchema, dataValidator)
export const exportsResolver = resolve<Exports, HookContext<ExportsService>>({})

export const exportsExternalResolver = resolve<Exports, HookContext<ExportsService>>({})

// Schema for creating new entries
export const exportsDataSchema = Type.Pick(exportsSchema, ['exportFor', 'filters'], {
  $id: 'ExportsData'
})
export type ExportsData = Static<typeof exportsDataSchema>
export const exportsDataValidator = getValidator(exportsDataSchema, dataValidator)
export const exportsDataResolver = resolve<Exports, HookContext<ExportsService>>({})

// Schema for updating existing entries
export const exportsPatchSchema = Type.Partial(exportsSchema, {
  $id: 'ExportsPatch'
})
export type ExportsPatch = Static<typeof exportsPatchSchema>
export const exportsPatchValidator = getValidator(exportsPatchSchema, dataValidator)
export const exportsPatchResolver = resolve<Exports, HookContext<ExportsService>>({})

// Schema for allowed query properties
export const exportsQueryProperties = Type.Pick(exportsSchema, [])
export const exportsQuerySchema = Type.Intersect(
  [
    querySyntax(exportsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type ExportsQuery = Static<typeof exportsQuerySchema>
export const exportsQueryValidator = getValidator(exportsQuerySchema, queryValidator)
export const exportsQueryResolver = resolve<ExportsQuery, HookContext<ExportsService>>({})
