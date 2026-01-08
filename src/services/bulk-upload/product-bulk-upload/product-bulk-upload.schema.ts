// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../../declarations'
import { dataValidator, queryValidator } from '../../../validators'
import type { ProductBulkUploadService } from './product-bulk-upload.class'

// Main data model schema
export const productBulkUploadSchema = Type.Object(
  {
    id: Type.Number()
  },
  { $id: 'ProductBulkUpload', additionalProperties: false }
)
export type ProductBulkUpload = Static<typeof productBulkUploadSchema>
export const productBulkUploadValidator = getValidator(productBulkUploadSchema, dataValidator)
export const productBulkUploadResolver = resolve<ProductBulkUpload, HookContext<ProductBulkUploadService>>({})

export const productBulkUploadExternalResolver = resolve<
  ProductBulkUpload,
  HookContext<ProductBulkUploadService>
>({})

// Schema for creating new entries
export const productBulkUploadDataSchema = Type.Pick(productBulkUploadSchema, [], {
  $id: 'ProductBulkUploadData'
})
export type ProductBulkUploadData = Static<typeof productBulkUploadDataSchema>
export const productBulkUploadDataValidator = getValidator(productBulkUploadDataSchema, dataValidator)
export const productBulkUploadDataResolver = resolve<
  ProductBulkUpload,
  HookContext<ProductBulkUploadService>
>({})

// Schema for updating existing entries
export const productBulkUploadPatchSchema = Type.Partial(productBulkUploadSchema, {
  $id: 'ProductBulkUploadPatch'
})
export type ProductBulkUploadPatch = Static<typeof productBulkUploadPatchSchema>
export const productBulkUploadPatchValidator = getValidator(productBulkUploadPatchSchema, dataValidator)
export const productBulkUploadPatchResolver = resolve<
  ProductBulkUpload,
  HookContext<ProductBulkUploadService>
>({})

// Schema for allowed query properties
export const productBulkUploadQueryProperties = Type.Pick(productBulkUploadSchema, ['id'])
export const productBulkUploadQuerySchema = Type.Intersect(
  [
    querySyntax(productBulkUploadQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type ProductBulkUploadQuery = Static<typeof productBulkUploadQuerySchema>
export const productBulkUploadQueryValidator = getValidator(productBulkUploadQuerySchema, queryValidator)
export const productBulkUploadQueryResolver = resolve<
  ProductBulkUploadQuery,
  HookContext<ProductBulkUploadService>
>({})
