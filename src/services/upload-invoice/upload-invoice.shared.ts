// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  UploadInvoice,
  UploadInvoiceData,
  UploadInvoicePatch,
  UploadInvoiceQuery,
  UploadInvoiceService
} from './upload-invoice.class'

export type { UploadInvoice, UploadInvoiceData, UploadInvoicePatch, UploadInvoiceQuery }

export const uploadInvoicePath = 'upload-invoice'

export const uploadInvoiceMethods: Array<keyof UploadInvoiceService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]
