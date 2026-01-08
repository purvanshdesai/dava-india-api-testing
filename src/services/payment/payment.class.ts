// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  PaymentModel,
  type Payment,
  type PaymentData,
  type PaymentPatch,
  type PaymentQuery
} from './payment.schema'
import { OrderModel } from '../order/order.schema'
import { BadRequest } from '@feathersjs/errors'
import { PAYMENT_GATEWAY_MAPPER, PAYMENT_GATEWAYS, PaymentGatewayType } from '../../payments'
import { onPaymentCaptured, onPaymentFailed } from '../../payments/utils'
import { PayUPaymentGateway } from '../../payments/payu/PayuGateway'
import moment from 'moment'
import { MembershipOrderModel } from '../membership-orders/membership-orders.schema'
import { getPaymentGateway } from './payment.shared'

export type { Payment, PaymentData, PaymentPatch, PaymentQuery }

export interface PaymentParams extends MongoDBAdapterParams<PaymentQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class PaymentService<ServiceParams extends Params = PaymentParams> extends MongoDBService<
  Payment,
  PaymentData,
  PaymentParams,
  PaymentPatch
> {}

export class VerifyPaymentService<ServiceParams extends Params = PaymentParams> extends MongoDBService<
  Payment,
  PaymentData,
  PaymentParams,
  PaymentPatch
> {
  async create(data: any, params?: any): Promise<any> {
    // console.log('Verifying payment ...', data)

    // Check the order based on payment order id
    const { paymentOrderId, orderId, paymentFor } = data

    let order

    if (paymentFor === 'order') order = await OrderModel.findOne({ paymentOrderId, _id: orderId }).lean()
    else order = await MembershipOrderModel.findOne({ paymentOrderId, _id: orderId }).lean()

    if (!order) throw new BadRequest('Order not found!')

    if (order.status !== 'paid' && order.status !== 'failed') {
      // Verify the payment in payment gateway
      const paymentGateway = getPaymentGateway(PAYMENT_GATEWAYS.PAYU) as PayUPaymentGateway

      const verifiedPayment = await paymentGateway?.verifyPayment({ txnid: paymentOrderId })

      if (!verifiedPayment) throw new BadRequest('Payment not found for the given transaction Id!')
      // update the status

      switch (verifiedPayment.status) {
        case 'success':
          await onPaymentCaptured(paymentGateway.createPaymentResponsePayload(verifiedPayment))
          break
        case 'failure':
          await onPaymentFailed(paymentGateway.createPaymentResponsePayload(verifiedPayment))
          break

        default:
          console.log('Other status received!')
      }
    }

    const updatedOrder: any =
      paymentFor === 'order'
        ? await OrderModel.findById(order?._id).lean()
        : await MembershipOrderModel.findById(order?._id).lean()

    let payment

    if (updatedOrder?.status === 'paid') {
      payment = await PaymentModel.findOne({ order: updatedOrder?._id }).lean()
    }

    return {
      verificationStatus: updatedOrder?.status === 'paid' ? 'success' : 'failed',
      orderDetails: {
        orderId: updatedOrder?.orderId ?? updatedOrder?._id,
        date: moment(updatedOrder?.createdAt).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss A'),
        amount: updatedOrder?.orderTotal ?? updatedOrder?.paymentAmount,
        paymentMethod: payment?.paymentResponse?.mode,
        email: params?.user?.email,
        note: payment?.paymentResponse?.field9
      },
      order: { ...updatedOrder, transactionId: payment?.transactionId }
    }
  }
}

export class PayuPaymentDynamicHashCreationService<
  ServiceParams extends Params = PaymentParams
> extends MongoDBService<Payment, PaymentData, PaymentParams, PaymentPatch> {
  getGateway(type: PaymentGatewayType) {
    const GatewayClass = PAYMENT_GATEWAY_MAPPER[type]
    return new GatewayClass()
  }

  async create(data: any, params?: any): Promise<any> {
    // console.log('Verifying payment ...', data)

    const paymentGateway = this.getGateway('payu') as PayUPaymentGateway
    const hash = paymentGateway.generateDynamicHash(data?.hashString + paymentGateway.config.merchantSalt)

    return { hash }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('payment'))
  }
}
