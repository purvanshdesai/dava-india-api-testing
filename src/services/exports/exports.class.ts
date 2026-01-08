// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type { Exports, ExportsData, ExportsPatch, ExportsQuery } from './exports.schema'
import path from 'path'
import fs from 'fs'
import { app } from '../../app'
import XLSX from 'xlsx'
import { exportOrders } from '../super-admin-users/orders/orders.shared'
import { exportMedicineRequests } from '../medicine-requests/medicine-requests.shared'
import { exportUsers } from '../users/users.shared'
import { exportProducts } from '../super-admin/products/products.shared'
import { exportTickets } from '../tickets/tickets.shared'

export type { Exports, ExportsData, ExportsPatch, ExportsQuery }

export interface ExportsServiceOptions {
  app: Application
}

export interface ExportsParams extends Params<ExportsQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class ExportsService<ServiceParams extends ExportsParams = ExportsParams>
  implements ServiceInterface<Exports, ExportsData, ServiceParams, ExportsPatch>
{
  constructor(public options: ExportsServiceOptions) {}

  async create(data: { exportFor: string; filters?: any }, params?: ServiceParams): Promise<any> {
    let records = []
    let fileName = 'Davaindia-export.xlsx'
    let productRecords = []

    switch (data.exportFor) {
      case 'orders':
        records = await exportOrders(data?.filters)
        fileName = 'Davaindia-orders.xlsx'
        productRecords = await this.exportProductWiseReport(data?.filters)
        break

      case 'medicine-requests':
        records = await exportMedicineRequests(data?.filters)
        fileName = 'Davaindia-medicine-requests.xlsx'
        break

      case 'customers':
        records = await exportUsers(data?.filters)
        fileName = 'Davaindia-consumers.xlsx'
        break

      case 'products':
        records = await exportProducts(data?.filters)
        fileName = 'Davaindia-products.xlsx'
        break

      case 'tickets':
      case 'inquiries':
        records = await exportTickets(data?.filters)
        fileName = 'Davaindia-inquiries.xlsx'
        break

      default:
        console.log('Invalid exportFor type')
    }

    const filePath =
      data.exportFor === 'products'
        ? await this.saveRecordsInSingleSheet(records, fileName, 'Products Report')
        : data.exportFor === 'tickets' || data.exportFor === 'inquiries'
          ? await this.saveRecordsInSingleSheet(records, fileName, 'Inquiries')
          : await this.saveRecordsInFile(records, productRecords, fileName)

    return { filePath: filePath ?? '' }
  }

  async exportProductWiseReport(filters: any): Promise<any[]> {
    try {
      const { OrderModel } = await import('../../services/order/order.schema')
      const moment = await import('moment-timezone')
      const TZ = 'Asia/Kolkata'

      // Build createdAt range filter (same as exportOrders)
      const buildCreatedAtMatch = (f: any) => {
        if (!f?.dateRange) return null

        const dr = f.dateRange
        const startInput = dr.start ?? dr.from ?? dr.gte ?? dr[0]
        const endInput = dr.end ?? dr.to ?? dr.lte ?? dr[1]

        const match: any = {}
        if (startInput) {
          match.$gte = moment.default.tz(startInput, TZ).startOf('day').toDate()
        }
        if (endInput) {
          match.$lt = moment.default.tz(endInput, TZ).add(1, 'day').startOf('day').toDate()
        }

        return Object.keys(match).length ? match : null
      }

      const createdAtMatch = buildCreatedAtMatch(filters)

      // Process column filters
      const columnFilters = filters?.columnFilters || []
      let statusFilter: string[] = []
      let paymentMethodFilter: string[] = []
      let deliveryModeFilter: string[] = []
      let timelineStatusFilter: string[] = []
      let hasDavaoneMembershipValue: any = undefined

      for (const filter of columnFilters) {
        if (filter.id === 'status' && filter.value) {
          statusFilter = Array.isArray(filter.value) ? filter.value : [filter.value]
        } else if (filter.id === 'payment' && filter.value) {
          paymentMethodFilter = Array.isArray(filter.value) ? filter.value : [filter.value]
        } else if (filter.id === 'deliveryMode' && filter.value) {
          deliveryModeFilter = Array.isArray(filter.value) ? filter.value : [filter.value]
        } else if (filter.id === 'lastTimelineStatus' && filter.value) {
          timelineStatusFilter = Array.isArray(filter.value) ? filter.value : [filter.value]
        } else if (filter.id === 'hasDavaoneMembership' && filter.value) {
          const values = Array.isArray(filter.value) ? filter.value : [filter.value]
          if (values.length === 1) {
            hasDavaoneMembershipValue = values[0] === 'true' ? true : false
          }
        }
      }

      // Build aggregation pipeline
      const pipeline: any[] = []

      // Initial match for createdAt
      if (createdAtMatch) {
        pipeline.push({ $match: { createdAt: createdAtMatch } })
      }

      // Status filter (always exclude failed, and apply additional status filters if any)
      const statusMatch: any = { status: { $ne: 'failed' } }
      if (statusFilter.length > 0) {
        statusMatch.status = { $in: statusFilter }
      }
      pipeline.push({ $match: statusMatch })

      // Delivery mode filter
      if (deliveryModeFilter.length > 0) {
        pipeline.push({ $match: { deliveryMode: { $in: deliveryModeFilter } } })
      }

      // User lookup for hasDavaoneMembership filter
      if (hasDavaoneMembershipValue !== undefined) {
        pipeline.push({
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userId',
            pipeline: [
              {
                $project: {
                  _id: 1,
                  hasDavaoneMembership: 1
                }
              }
            ]
          }
        })
        pipeline.push({ $unwind: '$userId' })
        pipeline.push({
          $match: {
            'userId.hasDavaoneMembership':
              hasDavaoneMembershipValue === true || hasDavaoneMembershipValue === 'true'
          }
        })
      }

      // Payment method filter
      if (paymentMethodFilter.length > 0) {
        pipeline.push({
          $lookup: {
            from: 'payments',
            localField: '_id',
            foreignField: 'order',
            as: 'payment'
          }
        })
        pipeline.push({
          $addFields: {
            payment: { $arrayElemAt: ['$payment', 0] }
          }
        })
        pipeline.push({
          $match: {
            'payment.paymentResponse.method': { $in: paymentMethodFilter }
          }
        })
      }

      // Timeline status filter
      if (timelineStatusFilter.length > 0) {
        pipeline.push({
          $lookup: {
            from: 'order-item-tracking',
            localField: '_id',
            foreignField: 'order',
            as: 'trackingData'
          }
        })
        pipeline.push({
          $match: {
            trackingData: {
              $elemMatch: {
                lastTimelineStatus: { $in: timelineStatusFilter }
              }
            }
          }
        })
      }

      // Continue with existing pipeline
      pipeline.push({ $sort: { _id: -1 } })
      pipeline.push({ $unwind: '$items' })
      pipeline.push({
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'productDetails'
        }
      })
      pipeline.push({ $unwind: { path: '$productDetails', preserveNullAndEmptyArrays: true } })
      pipeline.push({
        $project: {
          orderId: 1,
          productTitle: '$productDetails.title',
          productCode: '$productDetails.sku',
          quantity: '$items.quantity'
        }
      })

      // Execute aggregation
      const productWiseData = await OrderModel.aggregate(pipeline)

      // Format the data for Excel export
      const formattedData = productWiseData.map((item: any) => ({
        'ORDER ID': item.orderId || '',
        'PRODUCT TITLE': item.productTitle || '',
        'PRODUCT CODE': item.productCode || '',
        'ORDERED QUANTITY': item.quantity || 0
      }))

      return formattedData
    } catch (error) {
      console.error('Error exporting product-wise report:', error)
      throw new Error('Failed to export product-wise report')
    }
  }

  async saveRecordsInFile(records: any[], productRecords: any[], fileName: string) {
    try {
      const uploadDir = path.join('public', 'reports')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      const directoryPath = `public/reports/${fileName}`

      const filePath: string = `${app.get('deployment')?.api_public_url}/${directoryPath.replace('public/', '')}`

      // Create a new workbook
      const workbook = XLSX.utils.book_new()

      // Convert order data to a worksheet and append
      const ordersWorksheet = XLSX.utils.json_to_sheet(records)
      XLSX.utils.book_append_sheet(workbook, ordersWorksheet, 'Orders Report')

      // Convert product-wise data to a worksheet and append
      if (productRecords && productRecords.length > 0) {
        const productWorksheet = XLSX.utils.json_to_sheet(productRecords)
        XLSX.utils.book_append_sheet(workbook, productWorksheet, 'Product Wise Report')
      }

      // Write the file
      XLSX.writeFile(workbook, directoryPath)

      console.log(`Exported file saved as: ${filePath}`)

      return filePath
    } catch (e) {
      console.log('Error while saving Excel file', e)
    }
  }

  async saveRecordsInSingleSheet(records: any[], fileName: string, sheetName: string) {
    try {
      const uploadDir = path.join('public', 'reports')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      const directoryPath = `public/reports/${fileName}`
      const filePath: string = `${app.get('deployment')?.api_public_url}/${directoryPath.replace('public/', '')}`

      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(records)

      // Apply wrap text to cells that contain line breaks
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
          if (!worksheet[cellAddress]) continue

          const cell = worksheet[cellAddress]
          // If cell contains newline characters, set wrap text
          if (cell.v && typeof cell.v === 'string' && cell.v.includes('\n')) {
            if (!cell.s) cell.s = {}
            cell.s.alignment = { wrapText: true, vertical: 'top' }
          }
        }
      }

      // Set column widths
      if (sheetName === 'Inquiries') {
        worksheet['!cols'] = [
          { wch: 15 }, // Ticket No
          { wch: 20 }, // Ticket Date
          { wch: 20 }, // Due Date
          { wch: 15 }, // Order No
          { wch: 20 }, // Order Date
          { wch: 20 }, // Raised By
          { wch: 12 }, // Status
          { wch: 35 }, // Reason
          { wch: 20 }, // Patient Name
          { wch: 15 }, // Relation
          { wch: 15 }, // Patient Gender
          { wch: 12 }, // Patient Age
          { wch: 15 }, // Phone Number
          { wch: 20 }, // Assignee
          { wch: 60 } // Notes Added (wider for multi-line text)
        ]
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

      XLSX.writeFile(workbook, directoryPath, { cellStyles: true })
      console.log(`Exported file saved as: ${filePath}`)
      return filePath
    } catch (e) {
      console.log('Error while saving Excel file', e)
    }
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
