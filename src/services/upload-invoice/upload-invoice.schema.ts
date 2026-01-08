// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { UploadInvoiceService } from './upload-invoice.class'

// Main data model schema
export const uploadInvoiceSchema = Type.Object(
  {
    invoiceUrl: Type.String(),
    orderId: Type.String()
  },
  { $id: 'UploadInvoice', additionalProperties: false }
)
export type UploadInvoice = Static<typeof uploadInvoiceSchema>
export const uploadInvoiceValidator = getValidator(uploadInvoiceSchema, dataValidator)
export const uploadInvoiceResolver = resolve<UploadInvoice, HookContext<UploadInvoiceService>>({})

export const uploadInvoiceExternalResolver = resolve<UploadInvoice, HookContext<UploadInvoiceService>>({})

// Schema for creating new entries
export const uploadInvoiceDataSchema = Type.Pick(uploadInvoiceSchema, ['invoiceUrl', 'orderId'], {
  $id: 'UploadInvoiceData'
})
export type UploadInvoiceData = Static<typeof uploadInvoiceDataSchema>
export const uploadInvoiceDataValidator = getValidator(uploadInvoiceDataSchema, dataValidator)
export const uploadInvoiceDataResolver = resolve<UploadInvoice, HookContext<UploadInvoiceService>>({})

// Schema for updating existing entries
export const uploadInvoicePatchSchema = Type.Partial(uploadInvoiceSchema, {
  $id: 'UploadInvoicePatch'
})
export type UploadInvoicePatch = Static<typeof uploadInvoicePatchSchema>
export const uploadInvoicePatchValidator = getValidator(uploadInvoicePatchSchema, dataValidator)
export const uploadInvoicePatchResolver = resolve<UploadInvoice, HookContext<UploadInvoiceService>>({})

// Schema for allowed query properties
export const uploadInvoiceQueryProperties = Type.Pick(uploadInvoiceSchema, [])
export const uploadInvoiceQuerySchema = Type.Intersect(
  [
    querySyntax(uploadInvoiceQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type UploadInvoiceQuery = Static<typeof uploadInvoiceQuerySchema>
export const uploadInvoiceQueryValidator = getValidator(uploadInvoiceQuerySchema, queryValidator)
export const uploadInvoiceQueryResolver = resolve<UploadInvoiceQuery, HookContext<UploadInvoiceService>>({})
