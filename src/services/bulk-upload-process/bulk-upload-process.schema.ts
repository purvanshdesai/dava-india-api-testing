// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { BulkUploadProcessService } from './bulk-upload-process.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const bulkUploadProcessSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    processName: Type.String(),
    type: StringEnum(['super-admin', 'store-admin']),
    totalRecords: Type.Number(),
    errors: Type.Number(),
    validRows: Type.Number(),
    insertedCount: Type.Number(),
    failedCount: Type.Number(),
    status: StringEnum(['done', 'in-progress', 'pending']),
    percentage: Type.Number({ default: 0 }),
    superAdminUser: Type.Optional(ModelObjectId({ mongoose: { ref: 'super-admin-users' } })),
    storeAdminUser: Type.Optional(ModelObjectId({ mongoose: { ref: 'store-admin-users' } })),
    errorFilePath: Type.Optional(Type.String()),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' })
  },
  { $id: 'BulkUploadProcess', additionalProperties: false }
)
export type BulkUploadProcess = Static<typeof bulkUploadProcessSchema>
export const bulkUploadProcessValidator = getValidator(bulkUploadProcessSchema, dataValidator)
export const bulkUploadProcessResolver = resolve<BulkUploadProcess, HookContext<BulkUploadProcessService>>({})

export const bulkUploadProcessExternalResolver = resolve<
  BulkUploadProcess,
  HookContext<BulkUploadProcessService>
>({})

// Schema for creating new entries
export const bulkUploadProcessDataSchema = Type.Pick(
  bulkUploadProcessSchema,
  [
    'processName',
    'type',
    'errors',
    'validRows',
    'totalRecords',
    'insertedCount',
    'failedCount',
    'superAdminUser',
    'storeAdminUser',
    'status',
    'percentage',
    'errorFilePath',
    'createdAt',
    'updatedAt'
  ],
  {
    $id: 'BulkUploadProcessData'
  }
)
export type BulkUploadProcessData = Static<typeof bulkUploadProcessDataSchema>
export const bulkUploadProcessDataValidator = getValidator(bulkUploadProcessDataSchema, dataValidator)
export const bulkUploadProcessDataResolver = resolve<
  BulkUploadProcess,
  HookContext<BulkUploadProcessService>
>({})

// Schema for updating existing entries
export const bulkUploadProcessPatchSchema = Type.Partial(bulkUploadProcessSchema, {
  $id: 'BulkUploadProcessPatch'
})
export type BulkUploadProcessPatch = Static<typeof bulkUploadProcessPatchSchema>
export const bulkUploadProcessPatchValidator = getValidator(bulkUploadProcessPatchSchema, dataValidator)
export const bulkUploadProcessPatchResolver = resolve<
  BulkUploadProcess,
  HookContext<BulkUploadProcessService>
>({})

// Schema for allowed query properties
export const bulkUploadProcessQueryProperties = Type.Pick(bulkUploadProcessSchema, ['_id'])
export const bulkUploadProcessQuerySchema = Type.Intersect(
  [
    querySyntax(bulkUploadProcessQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type BulkUploadProcessQuery = Static<typeof bulkUploadProcessQuerySchema>
export const bulkUploadProcessQueryValidator = getValidator(bulkUploadProcessQuerySchema, queryValidator)
export const bulkUploadProcessQueryResolver = resolve<
  BulkUploadProcessQuery,
  HookContext<BulkUploadProcessService>
>({})

// export const CouponsDb = Type.Omit(couponsSchema, ['_id'], { $id: 'CouponsDb' })
export const bulkUploadProcessDb = Type.Pick(
  bulkUploadProcessSchema,
  [
    'processName',
    'type',
    'errors',
    'totalRecords',
    'validRows',
    'insertedCount',
    'failedCount',
    'superAdminUser',
    'storeAdminUser',
    'status',
    'percentage',
    'errorFilePath',
    'createdAt',
    'updatedAt'
  ],
  {
    $id: 'CouponsDb'
  }
)

const mongooseSchema = typeboxToMongooseSchema(bulkUploadProcessDb)
export const BulkUploadProcessModel = makeMongooseModel('bulk-upload-process', mongooseSchema)
