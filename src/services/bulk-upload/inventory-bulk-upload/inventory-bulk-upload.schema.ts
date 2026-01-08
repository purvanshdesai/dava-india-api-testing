// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../../declarations'
import { dataValidator, queryValidator } from '../../../validators'
import type { InventoryBulkUploadService } from './inventory-bulk-upload.class'

// Main data model schema
export const inventoryBulkUploadSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    fileName: Type.String(),
    objectUrl: Type.String(),
    confirm: Type.Optional(Type.Boolean())
  },
  { $id: 'InventoryBulkUpload', additionalProperties: true }
)
export type InventoryBulkUpload = Static<typeof inventoryBulkUploadSchema>
export const inventoryBulkUploadValidator = getValidator(inventoryBulkUploadSchema, dataValidator)
export const inventoryBulkUploadResolver = resolve<
  InventoryBulkUpload,
  HookContext<InventoryBulkUploadService>
>({})

export const inventoryBulkUploadExternalResolver = resolve<
  InventoryBulkUpload,
  HookContext<InventoryBulkUploadService>
>({})

// Schema for creating new entries
export const inventoryBulkUploadDataSchema = Type.Pick(
  inventoryBulkUploadSchema,
  ['_id', 'fileName', 'objectUrl'],
  {
    $id: 'InventoryBulkUploadData'
  }
)
export type InventoryBulkUploadData = Static<typeof inventoryBulkUploadDataSchema>
export const inventoryBulkUploadDataValidator = getValidator(inventoryBulkUploadDataSchema, dataValidator)
export const inventoryBulkUploadDataResolver = resolve<
  InventoryBulkUpload,
  HookContext<InventoryBulkUploadService>
>({})

// Schema for updating existing entries
export const inventoryBulkUploadPatchSchema = Type.Partial(inventoryBulkUploadSchema, {
  $id: 'InventoryBulkUploadPatch'
})
export type InventoryBulkUploadPatch = Static<typeof inventoryBulkUploadPatchSchema>
export const inventoryBulkUploadPatchValidator = getValidator(inventoryBulkUploadPatchSchema, dataValidator)
export const inventoryBulkUploadPatchResolver = resolve<
  InventoryBulkUpload,
  HookContext<InventoryBulkUploadService>
>({})

// Schema for allowed query properties
export const inventoryBulkUploadQueryProperties = Type.Pick(inventoryBulkUploadSchema, ['confirm'])
export const inventoryBulkUploadQuerySchema = Type.Intersect(
  [
    querySyntax(inventoryBulkUploadQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: true })
  ],
  { additionalProperties: true }
)
export type InventoryBulkUploadQuery = Static<typeof inventoryBulkUploadQuerySchema>
export const inventoryBulkUploadQueryValidator = getValidator(inventoryBulkUploadQuerySchema, queryValidator)
export const inventoryBulkUploadQueryResolver = resolve<
  InventoryBulkUploadQuery,
  HookContext<InventoryBulkUploadService>
>({})
