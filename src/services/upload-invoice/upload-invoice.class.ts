// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type {
  UploadInvoice,
  UploadInvoiceData,
  UploadInvoicePatch,
  UploadInvoiceQuery
} from './upload-invoice.schema'
import { OrderModel } from '../order/order.schema'

export type { UploadInvoice, UploadInvoiceData, UploadInvoicePatch, UploadInvoiceQuery }

export interface UploadInvoiceServiceOptions {
  app: Application
}

export interface UploadInvoiceParams extends Params<UploadInvoiceQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class UploadInvoiceService {
  constructor(public options: UploadInvoiceServiceOptions) {}

  async find() {}

  async get() {}

  async create(data: UploadInvoiceData) {
    try {
      await OrderModel.findByIdAndUpdate(data.orderId, {
        invoice: data.invoiceUrl
      })
      return {
        message: 'invoice added'
      }
    } catch (error) {
      throw error
    }
  }

  // This method has to be added to the 'methods' option to make it available to clients
  async update() {}

  async patch() {}

  async remove() {}
}

export const getOptions = (app: Application) => {
  return { app }
}
