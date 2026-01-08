import { Orders } from 'razorpay/dist/types/orders'
import { TOrderDetails, PaymentGateway } from '../PaymentType'
import { Params } from '@feathersjs/feathers'
import { validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils'

const Razorpay = require('razorpay')
const feathers = require('@feathersjs/feathers')
const configuration = require('@feathersjs/configuration')
const appConfig = feathers().configure(configuration())
const razorpayKeys = appConfig.get('razorpay')

const razorpay = new Razorpay({
  key_id: razorpayKeys.id,
  key_secret: razorpayKeys.secret
})

export class RazorpayGateway extends PaymentGateway {
  private static instance: RazorpayGateway

  constructor() {
    super()
    if (RazorpayGateway.instance) {
      return RazorpayGateway.instance
    }
    RazorpayGateway.instance = this
  }

  async initOrder(orderData: TOrderDetails): Promise<Orders.RazorpayOrder> {
    try {
      const order = razorpay.orders.create({
        amount: this.amountFormatter(orderData.paymentAmount),
        currency: orderData.currency,
        notes: {
          userSocketId: orderData.userSocketId,
          paymentType: orderData.paymentType,
          userId: orderData.userId,
          orderId: orderData?.orderId,
          couponCode: orderData?.couponCode,
          paymentFor: orderData?.paymentFor ?? 'order'
        }
      })
      return order
    } catch (error) {
      throw error
    }
  }

  async validateWebhook(data: any, params: Params): Promise<boolean> {
    try {
      if (params?.headers && params?.headers['x-razorpay-signature']) {
        return validateWebhookSignature(
          JSON.stringify(data),
          params.headers['x-razorpay-signature'],
          razorpayKeys.webhookSecret
        )
      } else {
        return false
      }
    } catch (error) {
      throw error
    }
  }

  async refundPayment(transactionId: string, amount: number, opts: any): Promise<void> {
    try {
      return await razorpay.payments.refund(transactionId, {
        amount: Math.round((amount ?? 0) * 100),
        speed: 'optimum',
        notes: { ...opts }
      })
    } catch (error) {
      throw error
    }
  }

  async verifyPayment(data: any): Promise<any> {
    return {}
  }
}
