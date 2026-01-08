// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type { Webhooks, WebhooksData, WebhooksPatch, WebhooksQuery } from './webhooks.schema'
import { app } from '../../app'
import { OrderItemTrackingModal } from '../order-item-tracking/order-item-tracking.schema'
import { BadRequest, GeneralError, NotFound } from '@feathersjs/errors'
import { shipRocketTrackingActivityMapping } from '../../utils/logistics/Shiprocket'
import { shipRocketQuickTrackingActivityMapping } from '../../utils/logistics/ShiprocketQuick'
import { ScanData } from '../../utils/logistics/types'
import moment from 'moment'
import { OrderModel } from '../order/order.schema'
import { handleDeliveredEvent } from './webhooks.shared'
import { cancelStoreOrder } from '../order/order.shared'
import { trackOrderCancelled } from '../../analytics/trackers/index'

export type { Webhooks, WebhooksData, WebhooksPatch, WebhooksQuery }

export interface WebhooksServiceOptions {
  app: Application
}

export interface WebhooksParams extends Params<WebhooksQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class WebhooksService<ServiceParams extends WebhooksParams = WebhooksParams>
  implements ServiceInterface<Webhooks, WebhooksData, ServiceParams, WebhooksPatch>
{
  constructor(public options: WebhooksServiceOptions) {}

  async find(_params?: ServiceParams): Promise<any> {
    return {}
  }

  async get(id: Id, _params?: ServiceParams): Promise<Webhooks> {
    return {
      id: 0,
      text: `A new message with ID: ${id}!`
    }
  }

  async create(data: any, params?: any): Promise<any> {
    return {
      price: '333.20'
    }
  }

  // This method has to be added to the 'methods' option to make it available to clients
  async update(id: NullableId, data: WebhooksData, _params?: ServiceParams): Promise<Webhooks> {
    return {
      id: 0,
      ...data
    }
  }

  async patch(id: NullableId, data: WebhooksPatch, _params?: ServiceParams): Promise<Webhooks> {
    return {
      id: 0,
      text: `Fallback for ${id}`,
      ...data
    }
  }

  async remove(id: NullableId, _params?: ServiceParams): Promise<Webhooks> {
    return {
      id: 0,
      text: 'removed'
    }
  }
}

export class ChatBotWebhooksService<ServiceParams extends WebhooksParams = WebhooksParams>
  implements ServiceInterface<Webhooks, WebhooksData, ServiceParams, WebhooksPatch>
{
  constructor(public options: WebhooksServiceOptions) {}

  async find(_params?: ServiceParams): Promise<any> {
    return {}
  }

  async get(id: Id, _params?: ServiceParams): Promise<Webhooks> {
    return {
      id: 0,
      text: `A new message with ID: ${id}!`
    }
  }

  async create(data: any, params?: any): Promise<any> {
    const { session } = data
    const { controller } = session

    const searchProduct = async () => {
      const { searchBy, query } = session
      let searchByFields = []
      if (searchBy?.value === 'By Composition') {
        searchByFields = ['compositions']
      } else {
        searchByFields = ['title', 'description', 'searchSuggestionKeywords']
      }
      const result = await app
        .service('global-search')
        .find({ query: { search: query.value, searchBy: searchByFields } })

      // const result = {
      //   products: [
      //     {
      //       id: 'h8HjPZMBc21Q003fFr6o',
      //       productId: '6729ff0342849096680729b9',
      //       title: 'Paracetamol IP 650 mg Tablet (1*10)',
      //       description: '',
      //       thumbnail:
      //         'https://techpepo-development-s3.s3.ap-south-1.amazonaws.com/1oVmcp6NVCkNw3Gt1mwoo-b5a48f8e-2284-43b2-8c20-c60a1a932936.jpg',
      //       slugUrl: 'Fever',
      //       unitPrice: 15,
      //       maximumRetailPrice: 15,
      //       discount: 0,
      //       finalPrice: 15,
      //       searchSuggestionKeywords: ['fever', 'Dolo'],
      //       compositions: 'Paracetamol 650 mg',
      //       _id: '6729ff0342849096680729b9',
      //       seo: {
      //         url: 'Fever'
      //       }
      //     }
      //   ],
      //   compositions: ['Paracetamol 650 mg']
      // }
      return {
        result: result.products.slice(0, 3).map((p: any) => ({
          icon: p.thumbnail,
          target: '_blank|_self',
          text: p.title,
          url: `${app.get('clientWeb')}/products/${p.slugUrl}`
        }))
      }

      // return { result }
    }

    switch (controller?.value) {
      case 'Product Information':
        return await searchProduct()
    }

    return {
      result: [
        {
          icon: 'https://techpepo-development-s3.s3.ap-south-1.amazonaws.com/01kUO323ZeaAU8-pAnYJM-image%2053.png',
          target: '_blank|_self',
          text: 'Instant Mouth Freshener',
          url: 'https://dev-davaindia-client.teampumpkin.com/products/instantmouthfreshenerstripsupermint'
        },
        {
          icon: 'https://techpepo-development-s3.s3.ap-south-1.amazonaws.com/8C_sBYHAKjCt_TXXYWJYa-Group%201000004261.png',
          target: '_blank|_self',
          text: 'Collar Soft with Support',
          url: 'https://dev-davaindia-client.teampumpkin.com/products/collar-soft-with-support-large'
        },
        {
          icon: 'https://techpepo-development-s3.s3.ap-south-1.amazonaws.com/4jJdOLLo_HpHQdLKMXamK-Conditioner%201.jpg',
          target: '_blank|_self',
          text: 'Tea Tree Conditioner',
          url: 'https://dev-davaindia-client.teampumpkin.com/products/ayuveer-blueberry-tea-tree-conditioner'
        }
      ]
    }
  }

  // This method has to be added to the 'methods' option to make it available to clients
  async update(id: NullableId, data: WebhooksData, _params?: ServiceParams): Promise<Webhooks> {
    return {
      id: 0,
      ...data
    }
  }

  async patch(id: NullableId, data: WebhooksPatch, _params?: ServiceParams): Promise<Webhooks> {
    return {
      id: 0,
      text: `Fallback for ${id}`,
      ...data
    }
  }

  async remove(id: NullableId, _params?: ServiceParams): Promise<Webhooks> {
    return {
      id: 0,
      text: 'removed'
    }
  }
}

export class ShiprocketTrackingService<ServiceParams extends WebhooksParams = WebhooksParams>
  implements ServiceInterface<Webhooks, WebhooksData, ServiceParams, WebhooksPatch>
{
  constructor(public options: WebhooksServiceOptions) {}

  async create(data: any, params?: ServiceParams): Promise<any> {
    // console.log('Shiprocket webhook received ', JSON.stringify(data))
    try {
      // Find Order item tracking by awbNo
      const orderTracking = await OrderItemTrackingModal.findOne({
        $or: [{ awbNo: data.awb }, { shipmentId: `${data.shipment_id}` }],
        isDeleted: { $ne: true }
      }).lean()

      if (!orderTracking) {
        // console.log('Order item tracking not found!')
        // throw new BadRequest('Order tracking details not found')
        return {}
      }

      const order = await OrderModel.findById(orderTracking?.order).lean()

      if (orderTracking?.deliveryMode == 'oneDay') {
        const newActivity: any = await shipRocketQuickTrackingActivityMapping(data)

        const statusCode = newActivity?.statusCode

        if (statusCode) {
          if (statusCode === 'delivered') {
            await handleDeliveredEvent(order)
          }

          return await OrderItemTrackingModal.findByIdAndUpdate(orderTracking._id, {
            $push: { timeline: newActivity },
            $set: { lastTimelineStatus: statusCode }
          })
        }
      } else {
        const scans = data.scans || []
        const uniqueScans: ScanData[] = Object.values(
          scans.reduce((acc: Record<string, ScanData>, scan: ScanData) => {
            if (!acc[scan['sr-status']]) {
              acc[scan['sr-status']] = scan
            }
            return acc
          }, {})
        ) as ScanData[]

        const existingTimeline = orderTracking.timeline ?? []
        const isDelivered = existingTimeline.some(
          (item) => item?.type == 'order' && item?.statusCode === 'delivered'
        )
        if (isDelivered) {
          // console.log('Order already delivered. Skipping further updates.')
          return
        }

        const seen = new Set(existingTimeline.map((item) => `${item?.status}-${item?.dateTime}`))

        const filtered: ScanData[] | any = uniqueScans.filter((activity) => {
          const key = `${activity.status}-${activity?.date}`
          if (seen.has(key)) {
            return false // Already exists in DB, skip it
          }
          seen.add(key)
          return true // New entry, include it
        })

        const newActivitiesToInsert: Array<any> = await shipRocketTrackingActivityMapping(filtered)

        if (newActivitiesToInsert?.length) {
          return await OrderItemTrackingModal.findByIdAndUpdate(orderTracking?._id, {
            $push: { timeline: { $each: newActivitiesToInsert } },
            lastTimelineStatus: newActivitiesToInsert[newActivitiesToInsert.length - 1]?.statusCode
          })
        }
      }
    } catch (err: any) {
      throw err
    }
    return {}
  }

  async find(_params?: ServiceParams): Promise<any> {
    return []
  }

  async get(id: Id, _params?: ServiceParams): Promise<any> {
    return {
      id: 0,
      text: `A new message with ID: ${id}!`
    }
  }

  // This method has to be added to the 'methods' option to make it available to clients
  async update(id: NullableId, data: any, _params?: ServiceParams): Promise<any> {
    return {
      id: 0,
      ...data
    }
  }

  async patch(id: NullableId, data: any, _params?: ServiceParams): Promise<any> {
    return {
      id: 0,
      text: `Fallback for ${id}`,
      ...data
    }
  }

  async remove(id: NullableId, _params?: ServiceParams): Promise<any> {
    return {
      id: 0,
      text: 'removed'
    }
  }
}

export class ShiprocketQuickTrackingService<ServiceParams extends WebhooksParams = WebhooksParams>
  implements ServiceInterface<Webhooks, WebhooksData, ServiceParams, WebhooksPatch>
{
  constructor(public options: WebhooksServiceOptions) {}

  async create(data: any, params?: ServiceParams): Promise<any> {
    console.log('Shiprocket Quick webhook received ', JSON.stringify(data))
    try {
      // Find Order item tracking by awbNo
      const orderTracking = await OrderItemTrackingModal.findOne({
        shipmentId: `${data?.shipment_id}`,
        isDeleted: { $ne: true }
      }).lean()

      if (!orderTracking) {
        // console.log('Order item tracking not found!')
        // throw new BadRequest('Order tracking details not found')
        return {}
      }

      const newActivity: any = await shipRocketQuickTrackingActivityMapping(data)

      // console.log('newActivitiesToInsertShipRocketQuick ==>', newActivity)

      if (newActivity?.statusCode) {
        return await OrderItemTrackingModal.findByIdAndUpdate(orderTracking._id, {
          $push: { timeline: newActivity },
          $set: { lastTimelineStatus: newActivity.statusCode }
        })
      }
    } catch (err: any) {
      throw err
      // console.log('Error in shiprocket Quick webhook', err)
    }
    return {}
  }

  async find(_params?: ServiceParams): Promise<any> {
    return []
  }

  async get(id: Id, _params?: ServiceParams): Promise<any> {
    return {
      id: 0,
      text: `A new message with ID: ${id}!`
    }
  }

  // This method has to be added to the 'methods' option to make it available to clients
  async update(id: NullableId, data: any, _params?: ServiceParams): Promise<any> {
    return {
      id: 0,
      ...data
    }
  }

  async patch(id: NullableId, data: any, _params?: ServiceParams): Promise<any> {
    return {
      id: 0,
      text: `Fallback for ${id}`,
      ...data
    }
  }

  async remove(id: NullableId, _params?: ServiceParams): Promise<any> {
    return {
      id: 0,
      text: 'removed'
    }
  }
}

export class SwiggyTrackingService<ServiceParams extends WebhooksParams = WebhooksParams>
  implements ServiceInterface<Webhooks, WebhooksData, ServiceParams, WebhooksPatch>
{
  constructor(public options: WebhooksServiceOptions) {}

  async create(data: any, params?: ServiceParams | any): Promise<any> {
    // console.log('Swiggy webhook received ', JSON.stringify(data))
    try {
      const statusMapping: any = {
        // PLACED: 'order_placed',
        // CONFIRMED: 'order_confirmed',
        // DELIVERY_ASSIGNED: 'shipment_booked',
        // DELIVERY_UNASSIGNED: '',
        DELIVERY_CONFIRMED: 'shipment_booked',
        // DELIVERY_ARRIVED: 'in_transit',
        DELIVERY_PICKEDUP: 'picked_up',
        DELIVERY_REACHED: 'out_for_delivery',
        DELIVERY_DELIVERED: 'delivered'
        // CANCELLED: 'canceled',
        // RETURN_INITIATED: '',
        // RETURN_INITIATED: '',
        // RETURN_COMPLETED: ''
      }

      const currentStatus = data?.status

      const supportedStatus = Object.keys(statusMapping)

      if (!supportedStatus.includes(currentStatus)) return {}

      // Find Order item tracking by awbNo
      const orderTracking = await OrderItemTrackingModal.findOne({
        logisticsOrderId: data.orderId,
        isDeleted: { $ne: true }
      }).lean()
      if (!orderTracking) throw new BadRequest('Order tracking details not found')

      const existingTimeline = orderTracking.timeline ?? []

      const seen = new Set(existingTimeline.map((item) => `${item?.statusCode}`))

      let newActivitiesToInsert = []

      if (!seen.has(statusMapping[currentStatus])) {
        newActivitiesToInsert.push({
          date: moment
            .tz(new Date().toDateString(), 'YYYY-MM-DD HH:mm:ss', 'Asia/Kolkata')
            .tz('UTC')
            .toDate(),
          dateTime: new Date().toDateString(),
          authorType: 'logistics',
          authorName: 'Swiggy Genie',
          label: currentStatus,
          statusCode: statusMapping[currentStatus]
        })
      }

      // console.log('newActivitiesToInsert ==>', newActivitiesToInsert)

      if (newActivitiesToInsert?.length) {
        await OrderItemTrackingModal.findByIdAndUpdate(orderTracking?._id, {
          $push: { timeline: { $each: newActivitiesToInsert } },
          lastTimelineStatus: newActivitiesToInsert[newActivitiesToInsert.length - 1]?.statusCode
        })
      }

      return {}
    } catch (err: any) {
      // console.log('Error in Swiggy webhook', err)
      throw err
    }
  }
}

export class DelhiveryTrackingService<ServiceParams extends WebhooksParams = WebhooksParams>
  implements ServiceInterface<Webhooks, WebhooksData, ServiceParams, WebhooksPatch>
{
  constructor(public options: WebhooksServiceOptions) {}

  async create(data: any, params?: ServiceParams | any): Promise<any> {
    // console.log('Delhivery webhook received', JSON.stringify(data))

    try {
      const statusUpdate = this.keysToCamelDeep(data)
      const { shipment } = statusUpdate ?? {}

      if (!shipment) {
        throw new BadRequest('❌ Shipment details not received in webhook payload.')
      }

      // Required fields validation
      if (!shipment.referenceNo) {
        throw new BadRequest('❌ Missing referenceNo in shipment data.')
      }
      if (!shipment.status?.status) {
        throw new BadRequest('❌ Missing status in shipment data.')
      }

      const statusMapping: Record<string, string> = {
        Manifested: 'manifested',
        'In Transit': 'in_transit',
        'RTO-In Transit': 'rto_in_transit',
        Pending: 'delivery_pending',
        Dispatched: 'out_for_delivery',
        Delivered: 'delivered',
        RTO: 'rto_delivered',
        Scheduled: 'return_to_origin',
        DTO: 'rto_delivered',
        Canceled: 'cancelled'
      }

      const currentStatus = shipment.status.status
      const mappedStatus = statusMapping[currentStatus]

      if (!mappedStatus) {
        console.warn(`⚠️ Unsupported status received: ${currentStatus}`)
        return { message: `Ignored unsupported status: ${currentStatus}` }
      }

      // Handle split orders
      const isSplitOrder = shipment.referenceNo.includes('S')
      const orderId = isSplitOrder ? shipment.referenceNo.split('S')[0] : shipment.referenceNo
      const splitTrackingId = isSplitOrder ? shipment.referenceNo.split('S')[1] : null

      // Find the order
      const order = await OrderModel.findOne({ orderId }).lean()
      if (!order) {
        throw new NotFound(`❌ Order not found for referenceNo: ${shipment.referenceNo}`)
      }

      // Find tracking record
      const orderTracking = await OrderItemTrackingModal.findOne(
        isSplitOrder ? { order: order._id, splitTrackingId } : { order: order._id }
      ).lean()
      if (!orderTracking) {
        throw new NotFound(
          `❌ Tracking details not found for orderId=${orderId}, splitTrackingId=${splitTrackingId ?? 'N/A'}`
        )
      }

      const newActivity = {
        date: shipment?.status?.statusDateTime,
        dateTime: shipment?.status?.statusDateTime,
        authorType: 'logistics',
        authorName: 'Delhivery Tracking',
        label: this.snakeToTitleCase(mappedStatus),
        statusCode: mappedStatus,
        statusLocation: shipment.status?.statusLocation ?? null,
        instructions: shipment.status?.instructions ?? null
      }

      await OrderItemTrackingModal.findByIdAndUpdate(orderTracking._id, {
        $push: { timeline: newActivity },
        lastTimelineStatus: mappedStatus
      })

      // handle davacoins
      if (mappedStatus === statusMapping.Delivered) {
        await handleDeliveredEvent(order)
      }

      // Auto-cancel order on RTO in-transit status
      if (mappedStatus === 'rto_in_transit') {
        console.log(`🔄 RTO in-transit detected for order ${orderId}. Auto-canceling order...`)
        try {
          // Get order tracking with populated items
          const orderTrackingWithItems = await OrderItemTrackingModal.findById(orderTracking._id)
            .populate('items')
            .populate('order')
            .lean()

          if (orderTrackingWithItems) {
            // Cancel the order
            await cancelStoreOrder(orderTrackingWithItems)

            // Track cancellation event in CleverTap
            const orderWithUser = await OrderModel.findById(order._id)
              .populate('userId', '_id name email')
              .lean()
            const userId = orderWithUser?.userId as any

            await trackOrderCancelled({
              userId: userId?._id?.toString() || '',
              orderId: orderWithUser?.orderId || '',
              dateOfOrder: orderWithUser?.createdAt || new Date().toISOString(),
              customerName: userId?.name || '',
              email: userId?.email || '',
              cancellationReason: 'Delhivery RTO in-transit'
            })

            console.log(`✅ Order ${orderId} auto-canceled successfully due to RTO in-transit`)
          }
        } catch (cancelError) {
          console.error(`❌ Failed to auto-cancel order ${orderId}:`, cancelError)
          // Don't throw error - we still want to record the tracking status
        }
      }

      return {
        success: true,
        orderId,
        splitTrackingId,
        status: mappedStatus,
        message: `✅ Status updated to ${mappedStatus}`
      }
    } catch (err: any) {
      console.error('❌ Error in Delhivery webhook:', err)

      if (err instanceof BadRequest || err instanceof NotFound) {
        throw err
      }

      throw new GeneralError('Unexpected error while processing Delhivery webhook', {
        originalError: err.message ?? err
      })
    }
  }

  private snakeToTitleCase(str: string) {
    return str
      .split('_') // split by underscore
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // capitalize each word
      .join(' ') // join with space
  }

  private toCamelCase(str: string) {
    return str
      .replace(/([-_][a-z])/gi, (match) => match.toUpperCase().replace(/[-_]/g, ''))
      .replace(/^[A-Z]/, (match) => match.toLowerCase())
  }

  private keysToCamelDeep(obj: any): Record<any, any> {
    if (Array.isArray(obj)) {
      return obj.map((v) => this.keysToCamelDeep(v))
    } else if (obj !== null && obj.constructor === Object) {
      return Object.entries(obj).reduce((result: Record<string | any, string | any>, [key, value]) => {
        const camelKey = this.toCamelCase(key)
        result[camelKey] = this.keysToCamelDeep(value)
        return result
      }, {})
    }
    return obj
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
