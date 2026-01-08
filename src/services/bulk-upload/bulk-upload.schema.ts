// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { BulkUploadService } from './bulk-upload.class'

// Main data model schema
export const bulkUploadSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    text: Type.String()
  },
  { $id: 'BulkUpload', additionalProperties: false }
)
export type BulkUpload = Static<typeof bulkUploadSchema>
export const bulkUploadValidator = getValidator(bulkUploadSchema, dataValidator)
export const bulkUploadResolver = resolve<BulkUpload, HookContext<BulkUploadService>>({})

export const bulkUploadExternalResolver = resolve<BulkUpload, HookContext<BulkUploadService>>({})

// Schema for creating new entries
export const bulkUploadDataSchema = Type.Pick(bulkUploadSchema, ['text'], {
  $id: 'BulkUploadData'
})
export type BulkUploadData = Static<typeof bulkUploadDataSchema>
export const bulkUploadDataValidator = getValidator(bulkUploadDataSchema, dataValidator)
export const bulkUploadDataResolver = resolve<BulkUpload, HookContext<BulkUploadService>>({})

// Schema for updating existing entries
export const bulkUploadPatchSchema = Type.Partial(bulkUploadSchema, {
  $id: 'BulkUploadPatch'
})
export type BulkUploadPatch = Static<typeof bulkUploadPatchSchema>
export const bulkUploadPatchValidator = getValidator(bulkUploadPatchSchema, dataValidator)
export const bulkUploadPatchResolver = resolve<BulkUpload, HookContext<BulkUploadService>>({})

// Schema for allowed query properties
export const bulkUploadQueryProperties = Type.Pick(bulkUploadSchema, ['_id', 'text'])
export const bulkUploadQuerySchema = Type.Intersect(
  [
    querySyntax(bulkUploadQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type BulkUploadQuery = Static<typeof bulkUploadQuerySchema>
export const bulkUploadQueryValidator = getValidator(bulkUploadQuerySchema, queryValidator)
export const bulkUploadQueryResolver = resolve<BulkUploadQuery, HookContext<BulkUploadService>>({})
