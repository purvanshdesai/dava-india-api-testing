// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { DownloadExcelService } from './download-excel.class'

// Main data model schema
export const downloadExcelSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    text: Type.String()
  },
  { $id: 'DownloadExcel', additionalProperties: false }
)
export type DownloadExcel = Static<typeof downloadExcelSchema>
export const downloadExcelValidator = getValidator(downloadExcelSchema, dataValidator)
export const downloadExcelResolver = resolve<DownloadExcel, HookContext<DownloadExcelService>>({})

export const downloadExcelExternalResolver = resolve<DownloadExcel, HookContext<DownloadExcelService>>({})

// Schema for creating new entries
export const downloadExcelDataSchema = Type.Pick(downloadExcelSchema, ['text'], {
  $id: 'DownloadExcelData'
})
export type DownloadExcelData = Static<typeof downloadExcelDataSchema>
export const downloadExcelDataValidator = getValidator(downloadExcelDataSchema, dataValidator)
export const downloadExcelDataResolver = resolve<DownloadExcel, HookContext<DownloadExcelService>>({})

// Schema for updating existing entries
export const downloadExcelPatchSchema = Type.Partial(downloadExcelSchema, {
  $id: 'DownloadExcelPatch'
})
export type DownloadExcelPatch = Static<typeof downloadExcelPatchSchema>
export const downloadExcelPatchValidator = getValidator(downloadExcelPatchSchema, dataValidator)
export const downloadExcelPatchResolver = resolve<DownloadExcel, HookContext<DownloadExcelService>>({})

// Schema for allowed query properties
export const downloadExcelQueryProperties = Type.Pick(downloadExcelSchema, ['_id', 'text'])
export const downloadExcelQuerySchema = Type.Intersect(
  [
    querySyntax(downloadExcelQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type DownloadExcelQuery = Static<typeof downloadExcelQuerySchema>
export const downloadExcelQueryValidator = getValidator(downloadExcelQuerySchema, queryValidator)
export const downloadExcelQueryResolver = resolve<DownloadExcelQuery, HookContext<DownloadExcelService>>({})
