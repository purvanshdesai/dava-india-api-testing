// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { AttachmentsService } from './attachments.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

export const objectDetailsSchema = Type.Object(
  {
    size: Type.Number({
      description: 'Size of the file in bytes',
      example: 2385459
    }),
    fileName: Type.String({
      description: 'Generated name of the file stored in the storage service',
      example: 'YQn4um8s-YXYpCLRiYUBd-pexels-rdne-stock-project-6517778.jpg'
    }),
    originalFileName: Type.String({
      description: 'Original name of the uploaded file',
      example: 'pexels-rdne-stock-project-6517778.jpg'
    }),
    mimeType: Type.String({
      description: 'MIME type of the file',
      example: 'image/jpeg'
    })
  },
  { description: 'Details about the uploaded object' }
)

// Main data model schema
export const attachmentsSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    storageService: Type.String({
      description: 'Service where the file is stored',
      example: 'local'
    }),
    objectDetails: objectDetailsSchema,
    objectUrl: Type.String({
      description: 'URL to access the uploaded object',
      example: 'http://localhost:3030/uploads/YQn4um8s-YXYpCLRiYUBd-pexels-rdne-stock-project-6517778.jpg'
    }),
    attachmentBy: ModelObjectId({ mongoose: { ref: '' } }),
    files: Type.Optional(
      Type.Array(
        Type.Object({
          fileName: Type.String(),
          contentType: Type.String(),
          size: Type.Number()
        })
      )
    )
  },
  { $id: 'Attachments', additionalProperties: false }
)
export type Attachments = Static<typeof attachmentsSchema>
export const attachmentsValidator = getValidator(attachmentsSchema, dataValidator)
export const attachmentsResolver = resolve<Attachments, HookContext<AttachmentsService>>({})

export const attachmentsExternalResolver = resolve<Attachments, HookContext<AttachmentsService>>({})

// Schema for creating new entries
export const attachmentsDataSchema = Type.Pick(attachmentsSchema, ['files'], {
  $id: 'AttachmentsData'
})
export type AttachmentsData = Static<typeof attachmentsDataSchema>
export const attachmentsDataValidator = getValidator(attachmentsDataSchema, dataValidator)
export const attachmentsDataResolver = resolve<Attachments, HookContext<AttachmentsService>>({})

// Schema for updating existing entries
export const attachmentsPatchSchema = Type.Partial(attachmentsSchema, {
  $id: 'AttachmentsPatch'
})
export type AttachmentsPatch = Static<typeof attachmentsPatchSchema>
export const attachmentsPatchValidator = getValidator(attachmentsPatchSchema, dataValidator)
export const attachmentsPatchResolver = resolve<Attachments, HookContext<AttachmentsService>>({})

// Schema for allowed query properties
export const attachmentsQueryProperties = Type.Pick(attachmentsSchema, [])
export const attachmentsQuerySchema = Type.Intersect(
  [
    querySyntax(attachmentsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type AttachmentsQuery = Static<typeof attachmentsQuerySchema>
export const attachmentsQueryValidator = getValidator(attachmentsQuerySchema, queryValidator)
export const attachmentsQueryResolver = resolve<AttachmentsQuery, HookContext<AttachmentsService>>({})

export const attachmentDb = Type.Pick(attachmentsSchema, ['storageService', 'objectDetails', 'objectUrl'], {
  $id: 'AttachmentDb'
})

const mongooseSchema = typeboxToMongooseSchema(attachmentDb)

export const attachmentModel = makeMongooseModel('attachments', mongooseSchema)
