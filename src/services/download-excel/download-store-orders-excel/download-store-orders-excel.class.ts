// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../../declarations'
import type {
  DownloadStoreOrdersExcel,
  DownloadStoreOrdersExcelData,
  DownloadStoreOrdersExcelPatch,
  DownloadStoreOrdersExcelQuery
} from './download-store-orders-excel.schema'
import { saveExcelFile } from '../helper/excel'
import { app } from '../../../app'
import { OrderItemTrackingModal } from '../../order-item-tracking/order-item-tracking.schema'
import { OrderModel } from '../../order/order.schema'

export type {
  DownloadStoreOrdersExcel,
  DownloadStoreOrdersExcelData,
  DownloadStoreOrdersExcelPatch,
  DownloadStoreOrdersExcelQuery
}

export interface DownloadStoreOrdersExcelParams extends MongoDBAdapterParams<DownloadStoreOrdersExcelQuery> {}
function bufferToHex(buffer: any) {
  return Array.from(buffer)
    .map((b: any) => b.toString(16).padStart(2, '0'))
    .join('')
}
// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class DownloadStoreOrdersExcelService<
  ServiceParams extends Params = DownloadStoreOrdersExcelParams
> extends MongoDBService<
  DownloadStoreOrdersExcel,
  DownloadStoreOrdersExcelData,
  DownloadStoreOrdersExcelParams,
  DownloadStoreOrdersExcelPatch
> {
  async create(data: any, params?: any): Promise<any> {
    try {
      const ordersStore = [
        {
          field: '_id',
          name: 'Order ID',
          type: 'string',
          width: 30
        },
        {
          field: 'status',
          name: 'Order Status',
          type: 'string',
          width: 35
        },
        {
          field: 'paymentAmount',
          name: 'Payment Amount',
          type: 'number',
          width: 30
        }
        // {
        //   field: 'licenseNumber',
        //   name: 'License Number',
        //   type: 'number',
        //   width: 30
        // },

        // {
        //   field: 'email',
        //   name: 'Email',
        //   type: 'string',
        //   width: 45
        // },
        // {
        //   field: 'city',
        //   name: 'City',
        //   type: 'string',
        //   width: 35
        // },
        // {
        //   field: 'status',
        //   name: 'Status',
        //   type: 'string',
        //   width: 35
        // }
      ]

      try {
        const user = params?.user
        const store = user?.storeIds[0]
        const orderTrackingItems = await OrderItemTrackingModal.find({
          store,
          isDeleted: { $ne: true }
        }).lean()
        const orders = await OrderModel.find({
          _id: {
            $in: orderTrackingItems.map((item) => item.order)
          }
        })
          .populate('userId')
          .lean()

        const updatedData: any = orders.map((order: any) => ({
          ...order,
          _id: bufferToHex(order._id.buffer),
          items: order.items.map((item: any) => ({
            ...item,
            _id: bufferToHex(item._id.buffer),
            productId: bufferToHex(item.productId.buffer)
          }))
        }))
        const storeOrdersData = {
          fileName: './public/download/store-orders-report.xlsx',
          header: {
            title: {
              name: 'Store Orders data'
            },
            subTitle: {
              name: 'Store Orders data based on applied filter or sort'
            }
          },
          columns: ordersStore,
          sheetIndex: 1,
          data: updatedData,
          type: 'OrdersStoreDetails'
        }
        const response = await saveExcelFile(storeOrdersData)
        return { downloadLink: `${app.get('deployment').ip}/download/store-orders-report.xlsx` }
      } catch (error) {}
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('download-excel-download-store-orders-excel'))
  }
}
