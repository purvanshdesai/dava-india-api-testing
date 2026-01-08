// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type { Checkout, CheckoutData, CheckoutPatch, CheckoutQuery } from './checkout.schema'
import { CheckoutSessionModel, OrderModel } from '../order/order.schema'
import { StoreInventoryModel } from '../store-inventory/store-inventory.schema'
import { addToOrderCheckoutSessionQueue } from '../../jobs/queues/queue'
import { BadRequest } from '@feathersjs/errors'
import { OrderItemModel } from '../order-items/order-items.schema'
import { DeliveryPoliciesModel } from '../delivery-policies/delivery-policies.schema'
import { PaymentModel } from '../payment/payment.schema'
import { PAYMENT_GATEWAY_MAPPER, PaymentGatewayType } from '../../payments'
import { ORDER_CHECKOUT_SESSION_TIMEOUT } from '../../jobs/constants'

export type { Checkout, CheckoutData, CheckoutPatch, CheckoutQuery }

export interface CheckoutServiceOptions {
  app: Application
}

export interface CheckoutParams extends Params<CheckoutQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class CheckoutService<ServiceParams extends CheckoutParams = CheckoutParams>
  implements ServiceInterface<Checkout, CheckoutData, ServiceParams, CheckoutPatch>
{
  constructor(public options: CheckoutServiceOptions) {}

  async find(_params?: ServiceParams): Promise<Checkout[]> {
    return []
  }

  async get(id: Id, _params?: ServiceParams): Promise<any> {
    return {}
  }

  // async create(data: CheckoutData, params?: any): Promise<any> {
  //   const {
  //     route: { orderId },
  //     user
  //   } = params

  //   const order = await OrderModel.findOne({ _id: orderId, userId: user._id }).lean()
  //   if (!order) throw new BadRequest('order not found')

  //   const orderItems = await OrderItemModel.find({ order: order._id }).lean()
  //   if (!orderItems?.length) throw new BadRequest('Not items available in order')

  //   // TODO check which store can deliver items and hold those items from that store
  //   const postalCode = order.address?.postalCode
  //   const deliveryPolicy = await DeliveryPoliciesModel.findOne({
  //     postalCodes: postalCode
  //   }).lean()

  //   const checkoutItems = []
  //   for (const item of orderItems) {
  //     const productStock = await StoreInventoryModel.find({
  //       storeId: { $in: deliveryPolicy?.stores },
  //       productId: item.product,
  //       $expr: {
  //         $gt: [
  //           {
  //             $subtract: [
  //               {
  //                 $subtract: [
  //                   '$stock',
  //                   { $ifNull: ['$softHoldCount', 0] } // First subtraction
  //                 ]
  //               },
  //               { $ifNull: ['$softHoldForOrderCount', 0] } // Second subtraction
  //             ]
  //           }, // field2 - field1
  //           0 // only include documents where the result is > 0
  //         ]
  //       }
  //     }).lean()

  //     if (!productStock?.length) {
  //       throw new BadRequest('One or more items went out of stock')
  //     }

  //     const getRandomElement = (arr: any) => arr[Math.floor(Math.random() * arr.length)]
  //     const available = productStock.filter((ps: any) => ps.stock - (ps.softHoldCount ?? 0) >= item.quantity)
  //     if (!available.length) throw new Error('Enough quantity not available')

  //     const availableStore = getRandomElement(available)
  //     const allocateStoreId = availableStore.storeId

  //     checkoutItems.push({
  //       productId: item?.product,
  //       storeId: allocateStoreId,
  //       quantity: item?.quantity,
  //       softHoldRelease: false,
  //       orderHoldRelease: false
  //     })
  //   }

  //   const checkoutSession: any = {
  //     orderId: order?._id,
  //     userId: user?._id,
  //     items: checkoutItems,
  //     status: 'active',
  //     sessionStartTime: new Date(),
  //     sessionEndTime: new Date(new Date().getTime() + CONSTANTS.ORDER_CHECKOUT_SESSION_TIMOUT),
  //     createdAt: new Date()
  //   }

  //   await CheckoutSessionModel.create(checkoutSession)
  //   for (const checkoutItem of checkoutSession.items) {
  //     await StoreInventoryModel.findOneAndUpdate(
  //       { storeId: checkoutItem.storeId, productId: checkoutItem.productId },
  //       { $inc: { softHoldCount: checkoutItem.quantity } }
  //     )
  //   }
  //   addToOrderCheckoutSessionQueue({ orderId: order?._id })

  //   const paymentMode: 'razorpay' = data.paymentMode
  //   const paymentGateway = new paymentGatewayMap[paymentMode]()
  //   const paymentInfo = await paymentGateway.initOrder({
  //     currency: 'INR',
  //     paymentAmount: order?.paymentAmount,
  //     userId: user?._id?.toString(),
  //     userSocketId: data?.userSocketId,
  //     paymentType: 'online',
  //     orderId: order?._id?.toString()
  //   })

  //   await OrderModel.findByIdAndUpdate(order._id, { paymentOrderId: paymentInfo.id })
  //   await PaymentModel.create({
  //     amount: order.paymentAmount,
  //     currency: order.currency,
  //     order: order?._id,
  //     paymentGateway: order.paymentMode,
  //     status: 'pending',
  //     paymentOrderId: paymentInfo.id
  //   })

  //   return {
  //     ...order,
  //     paymentOrderId: paymentInfo.id
  //   }
  // }

  // This method has to be added to the 'methods' option to make it available to clients

  async create(data: CheckoutData, params?: any): Promise<any> {
    try {
      // Extract necessary data
      const {
        route: { orderId },
        user
      } = params

      // Step 1: Validate Order Existence
      const order = await OrderModel.findOne({ _id: orderId, userId: user._id }).lean()
      if (!order) throw new BadRequest('Order not found')

      // Step 2: Validate Order Items
      const orderItems = await OrderItemModel.find({ order: order._id }).lean()
      if (!orderItems?.length) throw new BadRequest('No items available in order')

      // Step 3: Fetch Delivery Policy
      const postalCode = order.address?.postalCode
      const deliveryPolicy = await DeliveryPoliciesModel.findOne({
        postalCodes: postalCode
      }).lean()

      if (!deliveryPolicy) throw new BadRequest('No delivery policy found for the postal code')

      // Step 4: Fetch Available Stock Across Stores
      const productStock = await this.getAvailableStock(deliveryPolicy.stores, orderItems)

      if (!productStock.length) {
        throw new BadRequest('One or more items went out of stock')
      }

      // Step 5: Allocate Stores for Each Item
      const checkoutItems = this.allocateStoresForItems(orderItems, productStock)

      // Step 6: Create Checkout Session
      const checkoutSession: any = await this.createCheckoutSession(order, user, checkoutItems)

      // Step 7: Update Soft Hold Count
      await this.updateSoftHoldCounts(checkoutSession.items)

      // Step 8: Queue Order Checkout Session
      addToOrderCheckoutSessionQueue({ orderId: order._id })

      // Step 9: Initiate Payment Process
      const paymentInfo = await this.initiatePayment(data, order, user)

      // Step 10: Update Order with Payment Info
      await OrderModel.findByIdAndUpdate(order._id, { paymentOrderId: paymentInfo.id })

      // Step 11: Create Payment Record
      await this.createPaymentRecord(order, paymentInfo)

      return {
        ...order,
        paymentOrderId: paymentInfo.id
      }
    } catch (error) {
      console.error('Checkout Error:', error)
      throw error
    }
  }

  async getAvailableStock(stores: any[], orderItems: any[]) {
    const productStock = await StoreInventoryModel.aggregate([
      {
        $match: {
          storeId: { $in: stores.map((s: any) => s._id) },
          productId: { $in: orderItems.map((item: any) => item.productId) },
          stock: { $gt: 0 },
          $expr: {
            $gte: [
              {
                $subtract: [
                  { $subtract: ['$stock', { $ifNull: ['$softHoldCount', 0] }] },
                  { $ifNull: ['$softHoldForOrderCount', 0] }
                ]
              },
              0
            ]
          }
        }
      },
      {
        $group: {
          _id: '$storeId',
          items: { $addToSet: '$productId' }
        }
      },
      {
        $project: {
          _id: 0,
          storeId: '$_id',
          items: 1
        }
      }
    ])
    if (!productStock?.length) throw new BadRequest('Product out of stock')

    return productStock ? productStock : []
  }

  allocateStoresForItems(orderItems: any[], productStock: any[]) {
    const itemToStoreMap: Record<string, string> = {}

    for (const store of productStock) {
      for (const productId of store.items) {
        if (!itemToStoreMap[productId]) {
          itemToStoreMap[productId] = store.storeId
        }
      }
    }

    return orderItems.map((item) => ({
      productId: item.productId,
      storeId: itemToStoreMap[item.productId] || null,
      quantity: item.quantity,
      softHoldRelease: false,
      orderHoldRelease: false
    }))
  }

  async createCheckoutSession(order: any, user: any, checkoutItems: any[]) {
    const checkoutSession = {
      orderId: order._id,
      userId: user._id,
      items: checkoutItems,
      status: 'active',
      sessionStartTime: new Date(),
      sessionEndTime: new Date(new Date().getTime() + ORDER_CHECKOUT_SESSION_TIMEOUT),
      createdAt: new Date()
    }

    return await CheckoutSessionModel.create(checkoutSession)
  }

  async updateSoftHoldCounts(checkoutItems: any[]) {
    await Promise.all(
      checkoutItems.map((checkoutItem) =>
        StoreInventoryModel.findOneAndUpdate(
          { storeId: checkoutItem.storeId, productId: checkoutItem.productId },
          { $inc: { softHoldCount: checkoutItem.quantity } }
        )
      )
    )
  }

  async initiatePayment(data: any, order: any, user: any) {
    const paymentMode: PaymentGatewayType = data.paymentMode
    const paymentGateway = new PAYMENT_GATEWAY_MAPPER[paymentMode]()

    return await paymentGateway.initOrder({
      currency: 'INR',
      paymentAmount: order.paymentAmount,
      userId: user._id?.toString(),
      userSocketId: data?.userSocketId,
      paymentType: 'online',
      orderId: order._id?.toString()
    })
  }

  async createPaymentRecord(order: any, paymentInfo: any) {
    await PaymentModel.create({
      amount: order.paymentAmount,
      currency: order.currency,
      order: order._id,
      paymentGateway: order.paymentMode,
      status: 'pending',
      paymentOrderId: paymentInfo.id
    })
  }

  async update(id: NullableId, data: CheckoutData, _params?: ServiceParams): Promise<any> {
    return {}
  }

  async patch(id: NullableId, data: CheckoutPatch, _params?: ServiceParams): Promise<any> {
    return {}
  }

  async remove(id: NullableId, _params?: ServiceParams): Promise<any> {
    return {}
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
