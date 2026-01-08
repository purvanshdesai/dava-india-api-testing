// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  OrderItems,
  OrderItemsData,
  OrderItemsPatch,
  OrderItemsQuery,
  OrderItemsService,
  SuperAdminOrderItemsService
} from './order-items.class'
import { BadRequest } from '@feathersjs/errors'
import { OrderItemModel } from './order-items.schema'

export type { OrderItems, OrderItemsData, OrderItemsPatch, OrderItemsQuery }

export type OrderItemsClientService = Pick<
  OrderItemsService<Params<OrderItemsQuery>>,
  (typeof orderItemsMethods)[number]
>

export type SuperAdminOrderItemsClientService = Pick<
  SuperAdminOrderItemsService<Params<OrderItemsQuery>>,
  (typeof orderItemsMethods)[number]
>

export const superAdminOrderItemsPath = 'super-admin/order-items'

export const orderItemsMethods: Array<keyof OrderItemsService> = ['find', 'get', 'create', 'patch', 'remove']

export const orderItemsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(superAdminOrderItemsPath, connection.service(superAdminOrderItemsPath), {
    methods: ['create']
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [superAdminOrderItemsPath]: SuperAdminOrderItemsClientService
  }
}

export const updateBatchNo = async (data: { orderItemId: string; batchNo: string }) => {
  const { orderItemId, batchNo } = data

  if (!batchNo) throw new BadRequest('Batch number must be provided')

  const orderItem = await OrderItemModel.findById(orderItemId).select('_id').lean()

  if (!orderItem) throw new BadRequest('Order Item not found')

  return await OrderItemModel.findByIdAndUpdate(orderItemId, { batchNo })
}

/**
 * Calculates per-unit discount amount from an OrderItem doc
 * and returns the discount amount for a given quantity.
 *
 * @param {Object} orderItem - The order item document
 * @param {number} [qty=1] - Quantity for which discount is needed (default 1)
 * @returns {number} - Discount amount for the given quantity
 */
export const getPartialItemDiscount = (orderItem: any, qty = 1) => {
  if (!orderItem || !orderItem.quantity) {
    throw new Error('Invalid orderItem data')
  }

  if (orderItem.discountAmount <= 0) return 0

  // Calculate per unit discount
  const perUnitDiscount = orderItem.discountAmount / orderItem.quantity

  // Calculate for given quantity
  return parseFloat((perUnitDiscount * qty).toFixed(2))
}
