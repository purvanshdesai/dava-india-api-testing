// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { DownloadsService } from './downloads.class'

// Main data model schema
export const downloadsSchema = Type.Object(
  {
    id: Type.Number(),
    text: Type.String()
  },
  { $id: 'Downloads', additionalProperties: false }
)
export type Downloads = Static<typeof downloadsSchema>
export const downloadsValidator = getValidator(downloadsSchema, dataValidator)
export const downloadsResolver = resolve<Downloads, HookContext<DownloadsService>>({})

export const downloadsExternalResolver = resolve<Downloads, HookContext<DownloadsService>>({})

// Schema for creating new entries
export const downloadsDataSchema = Type.Pick(downloadsSchema, ['text'], {
  $id: 'DownloadsData'
})
export type DownloadsData = Static<typeof downloadsDataSchema>
export const downloadsDataValidator = getValidator(downloadsDataSchema, dataValidator)
export const downloadsDataResolver = resolve<Downloads, HookContext<DownloadsService>>({})

// Schema for updating existing entries
export const downloadsPatchSchema = Type.Partial(downloadsSchema, {
  $id: 'DownloadsPatch'
})
export type DownloadsPatch = Static<typeof downloadsPatchSchema>
export const downloadsPatchValidator = getValidator(downloadsPatchSchema, dataValidator)
export const downloadsPatchResolver = resolve<Downloads, HookContext<DownloadsService>>({})

// Schema for allowed query properties
export const downloadsQueryProperties = Type.Pick(downloadsSchema, ['id', 'text'])
export const downloadsQuerySchema = Type.Intersect(
  [
    querySyntax(downloadsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type DownloadsQuery = Static<typeof downloadsQuerySchema>
export const downloadsQueryValidator = getValidator(downloadsQuerySchema, queryValidator)
export const downloadsQueryResolver = resolve<DownloadsQuery, HookContext<DownloadsService>>({})
