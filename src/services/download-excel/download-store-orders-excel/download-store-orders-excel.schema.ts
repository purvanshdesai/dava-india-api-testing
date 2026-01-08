// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../../declarations'
import { dataValidator, queryValidator } from '../../../validators'
import type { DownloadStoreOrdersExcelService } from './download-store-orders-excel.class'

// Main data model schema
export const downloadStoreOrdersExcelSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    text: Type.Optional(Type.String())
  },
  { $id: 'DownloadStoreOrdersExcel', additionalProperties: true }
)
export type DownloadStoreOrdersExcel = Static<typeof downloadStoreOrdersExcelSchema>
export const downloadStoreOrdersExcelValidator = getValidator(downloadStoreOrdersExcelSchema, dataValidator)
export const downloadStoreOrdersExcelResolver = resolve<
  DownloadStoreOrdersExcel,
  HookContext<DownloadStoreOrdersExcelService>
>({})

export const downloadStoreOrdersExcelExternalResolver = resolve<
  DownloadStoreOrdersExcel,
  HookContext<DownloadStoreOrdersExcelService>
>({})

// Schema for creating new entries
export const downloadStoreOrdersExcelDataSchema = Type.Pick(downloadStoreOrdersExcelSchema, ['text'], {
  $id: 'DownloadStoreOrdersExcelData'
})
export type DownloadStoreOrdersExcelData = Static<typeof downloadStoreOrdersExcelDataSchema>
export const downloadStoreOrdersExcelDataValidator = getValidator(
  downloadStoreOrdersExcelDataSchema,
  dataValidator
)
export const downloadStoreOrdersExcelDataResolver = resolve<
  DownloadStoreOrdersExcel,
  HookContext<DownloadStoreOrdersExcelService>
>({})

// Schema for updating existing entries
export const downloadStoreOrdersExcelPatchSchema = Type.Partial(downloadStoreOrdersExcelSchema, {
  $id: 'DownloadStoreOrdersExcelPatch'
})
export type DownloadStoreOrdersExcelPatch = Static<typeof downloadStoreOrdersExcelPatchSchema>
export const downloadStoreOrdersExcelPatchValidator = getValidator(
  downloadStoreOrdersExcelPatchSchema,
  dataValidator
)
export const downloadStoreOrdersExcelPatchResolver = resolve<
  DownloadStoreOrdersExcel,
  HookContext<DownloadStoreOrdersExcelService>
>({})

// Schema for allowed query properties
export const downloadStoreOrdersExcelQueryProperties = Type.Pick(downloadStoreOrdersExcelSchema, [
  '_id',
  'text'
])
export const downloadStoreOrdersExcelQuerySchema = Type.Intersect(
  [
    querySyntax(downloadStoreOrdersExcelQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: true })
  ],
  { additionalProperties: true }
)
export type DownloadStoreOrdersExcelQuery = Static<typeof downloadStoreOrdersExcelQuerySchema>
export const downloadStoreOrdersExcelQueryValidator = getValidator(
  downloadStoreOrdersExcelQuerySchema,
  queryValidator
)
export const downloadStoreOrdersExcelQueryResolver = resolve<
  DownloadStoreOrdersExcelQuery,
  HookContext<DownloadStoreOrdersExcelService>
>({})
