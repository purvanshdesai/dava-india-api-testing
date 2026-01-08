// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../../client'
import type {
  AddProductBatchNoService,
  CheckoutSessionFailedOrders,
  CreateTicketFromAdminService,
  SuperAdminOrders,
  SuperAdminOrdersData,
  SuperAdminOrdersPatch,
  SuperAdminOrdersQuery,
  SuperAdminOrdersService
} from './orders.class'
import { OrderModel } from '../../order/order.schema'
import moment from 'moment'

export type { SuperAdminOrders, SuperAdminOrdersData, SuperAdminOrdersPatch, SuperAdminOrdersQuery }

export type SuperAdminOrdersClientService = Pick<
  SuperAdminOrdersService<Params<SuperAdminOrdersQuery>>,
  (typeof superAdminOrdersMethods)[number]
>

export const superAdminOrdersPath = 'super-admin-users/orders'
export const addProductBatchNoPath = 'super-admin-users/orders/:orderId/products/batches'
export const superAdminOrdersExportPath = 'super-admin-users/orders/export'
export const checkoutSessionFailedOrdersPath = 'checkout-session-failed-order'
export const createTickerFromAdminPath = 'create-ticket-from-admin'
export const cancelOrderActionPath = 'super-admin-users/orders/cancel'
export const orderSkipLogisticsPath = 'super-admin-users/orders/skip-logistics'
export const modifyReturnPath = 'super-admin-users/orders/modify-return'

export const superAdminOrdersMethods: Array<keyof SuperAdminOrdersService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]
export const addProductBatchNoMethods: Array<keyof AddProductBatchNoService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]
export const checkoutSessionFailedOrdersMethods: Array<keyof CheckoutSessionFailedOrders> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]
export const createTicketFromAdminMethods: Array<keyof CreateTicketFromAdminService> = ['patch', 'create']

export const superAdminOrdersClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(superAdminOrdersPath, connection.service(superAdminOrdersPath), {
    methods: superAdminOrdersMethods
  })
}

// Add this service to the client service type index
declare module '../../../client' {
  interface ServiceTypes {
    [superAdminOrdersPath]: SuperAdminOrdersClientService
  }
}

interface OrderRow {
  'ORDER ID': string
  'CUSTOMER NAME': string
  'CUSTOMER EMAIL': string
  'ORDER DATE': string
  'STORE NAME': string
  'STORE CODE': string
  'PAYMENT MODE': string
  'PAYMENT STATUS': string
  'ORDER STATUS': string | any
  'MODE OF DELIVERY': string
  'DATE OF DELIVERY': string
  'ORDER AMOUNT': string
  'SUB TOTAL': string
  'DELIVERY CHARGE': string
  'TAX AMOUNT': string
  'HANDLING CHARGE': string
  'PACKING CHARGE': string
  'PLATFORM CHARGE': string
  'DISCOUNT AMOUNT': string
  'ORDER PAYMENT ID': string
  'TRANSACTION ID': string
  'REFUNDED AMOUNT': string
}

export const exportOrders = async (filters: any): Promise<any[]> => {
  try {
    console.time('Export Order time')
    const TZ = 'Asia/Kolkata'

    // Build createdAt range filter (inclusive of end date)
    const buildCreatedAtMatch = (f: any) => {
      if (!f?.dateRange) return null

      // Accept several shapes: {from,to} | {start,end} | [from,to] | {gte,lte}
      const dr = f.dateRange
      const startInput = dr.start ?? dr.from ?? dr.gte ?? dr[0]
      const endInput = dr.end ?? dr.to ?? dr.lte ?? dr[1]

      const match: any = {}
      if (startInput) {
        match.$gte = moment.tz(startInput, TZ).startOf('day').toDate()
      }
      if (endInput) {
        // use $lt next-day start to make the end date inclusive
        match.$lt = moment.tz(endInput, TZ).add(1, 'day').startOf('day').toDate()
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

    // Status filter
    if (statusFilter.length > 0) {
      pipeline.push({ $match: { status: { $in: statusFilter } } })
    }

    // Delivery mode filter
    if (deliveryModeFilter.length > 0) {
      pipeline.push({ $match: { deliveryMode: { $in: deliveryModeFilter } } })
    }

    // User lookup (always needed for customer data)
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
              name: 1,
              email: 1,
              phoneNumber: 1,
              hasDavaoneMembership: 1
            }
          }
        ]
      }
    })
    pipeline.push({ $unwind: { path: '$userId', preserveNullAndEmptyArrays: true } })

    // Apply hasDavaoneMembership filter after user lookup
    if (hasDavaoneMembershipValue !== undefined) {
      pipeline.push({
        $match: {
          'userId.hasDavaoneMembership':
            hasDavaoneMembershipValue === true || hasDavaoneMembershipValue === 'true'
        }
      })
    }

    // Payment lookup and filter
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
    } else {
      pipeline.push({
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'order',
          as: 'payment'
        }
      })
      pipeline.push({ $unwind: { path: '$payment', preserveNullAndEmptyArrays: true } })
    }

    // Tracking data lookup and timeline status filter
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
    } else {
      pipeline.push({
        $lookup: {
          from: 'order-item-tracking',
          localField: '_id',
          foreignField: 'order',
          as: 'trackingData'
        }
      })
    }

    // Refunds lookup
    pipeline.push({
      $lookup: {
        from: 'refunds',
        localField: '_id',
        foreignField: 'order',
        as: 'refunds'
      }
    })

    // Store details lookup
    pipeline.push({
      $lookup: {
        from: 'stores',
        localField: 'trackingData.store',
        foreignField: '_id',
        as: 'storeDetails'
      }
    })

    // Sort and calculate refund amount
    pipeline.push({ $sort: { _id: -1 } })
    pipeline.push({
      $addFields: {
        totalRefundAmount: {
          $reduce: {
            input: { $ifNull: ['$refunds', []] },
            initialValue: 0,
            in: { $add: ['$$value', { $divide: ['$$this.amount', 100] }] }
          }
        }
      }
    })

    // Execute aggregation
    const orders = await OrderModel.aggregate(pipeline)

    // Prepare enriched orders with all related data
    const enrichedOrders = orders.map((order: any) => {
      const trackingData = order.trackingData[order.trackingData.length - 1]

      // Collect all unique stores from tracking data for split orders
      const uniqueStoreIds = new Set(
        order.trackingData?.map((tracking: any) => tracking.store?.toString()).filter((id: string) => id)
      )
      const stores =
        order.storeDetails?.filter((store: any) => uniqueStoreIds.has(store._id?.toString())) || []

      // Create comma-separated store names and codes
      const storeNames = stores
        .map((store: any) => store.storeName)
        .filter(Boolean)
        .join(', ')
      const storeCodes = stores
        .map((store: any) => store.storeCode)
        .filter(Boolean)
        .join(', ')

      // Extract last timeline status
      const lastTimelineStatus = trackingData?.timeline
        ? trackingData.timeline[trackingData.timeline.length - 1]
        : null

      const refundTransactionIds = order.refunds?.map((refund: any) => refund.paymentId).filter(Boolean) || []

      // Format delivery mode
      const deliveryMode = order?.deliveryMode || trackingData?.deliveryMode || ''
      const formattedDeliveryMode =
        deliveryMode === 'oneDay' || deliveryMode === 'sameDay'
          ? 'Same Day'
          : deliveryMode === 'standard'
            ? 'Standard'
            : deliveryMode

      // Format delivery date - use etd from tracking data, or check timeline for delivered date
      let deliveryDate = ''
      if (trackingData?.etd) {
        deliveryDate = moment(trackingData.etd).tz('Asia/Kolkata').format('DD/MM/YYYY hh:mm A')
      } else if (trackingData?.timeline) {
        // Check if order is delivered and get the delivered date from timeline
        const deliveredStatus = trackingData.timeline.find(
          (item: any) => item.statusCode === 'delivered' || item.label?.toLowerCase().includes('delivered')
        )
        if (deliveredStatus?.dateTime) {
          // Parse date with various possible formats
          const parsedDate = moment.tz(
            deliveredStatus.dateTime,
            ['DD-MM-YYYY HH:mm:ss', 'DD-MM-YYYY HH:mm', 'YYYY-MM-DD HH:mm:ss', moment.ISO_8601],
            'Asia/Kolkata'
          )
          if (parsedDate.isValid()) {
            deliveryDate = parsedDate.format('DD/MM/YYYY hh:mm A')
          }
        } else if (deliveredStatus?.date) {
          // Parse date with various possible formats
          const parsedDate = moment.tz(
            deliveredStatus.date,
            ['DD-MM-YYYY', 'YYYY-MM-DD', moment.ISO_8601],
            'Asia/Kolkata'
          )
          if (parsedDate.isValid()) {
            deliveryDate = parsedDate.format('DD/MM/YYYY')
          }
        }
      }

      // Add D- prefix for dava-one members
      const hasDavaoneMembership = order.userId?.hasDavaoneMembership
      const displayOrderId = hasDavaoneMembership ? `D-${order.orderId}` : order.orderId

      const rowData: any = {
        'ORDER ID': displayOrderId,
        'CUSTOMER NAME': order.userId?.name,
        'CUSTOMER EMAIL': order.userId?.email,
        'CUSTOMER PHONE NO': order.userId?.phoneNumber,
        'ORDER DATE': moment(order?.createdAt).tz('Asia/Kolkata').format('DD/MM/YYYY hh:mm A'),
        'STORE NAME': storeNames || '', // Comma-separated store names for split orders
        'STORE CODE': storeCodes || '', // Comma-separated store codes for split orders
        'PAYMENT MODE':
          order?.payment?.paymentResponse?.mode || order?.payment?.paymentResponse?.method || '',
        'PAYMENT STATUS': order?.status?.toUpperCase(),
        'ORDER STATUS': lastTimelineStatus?.label || '',
        'ORDER AMOUNT': order.orderTotal,
        'SUB TOTAL': order?.subTotal,
        'DELIVERY CHARGE': order?.deliveryCharge,
        'TAX AMOUNT': order?.taxAmount,
        'HANDLING CHARGE': order?.handlingCharge,
        'PACKING CHARGE': order?.packingCharge,
        'PLATFORM CHARGE': order?.platformFee,
        'DISCOUNT AMOUNT': order?.discountedAmount,
        'ORDER PAYMENT ID': order?.paymentOrderId,
        'TRANSACTION ID': order?.payment?.transactionId || '',
        'REFUNDED AMOUNT': order.totalRefundAmount, // Total refunds already calculated in the aggregation pipeline
        'REFUND TRANSACTION IDS': refundTransactionIds.join(', '),
        'MODE OF DELIVERY': formattedDeliveryMode,
        'DATE OF DELIVERY': deliveryDate
      }

      return rowData
    })

    console.timeEnd('Export Order time')
    return enrichedOrders
  } catch (error) {
    console.error('Error exporting orders:', error)
    throw new Error('Failed to export orders')
  }
}
