import { Params } from '@feathersjs/feathers'
import { RazorpayGateway } from '../../../payments/razorpay/RazorpayGateway'
import { onPaymentCaptured, onPaymentFailed, onPaymentRefundProcessed } from '../../../payments/utils'
import { PaymentResponse } from '../../../payments/PaymentType'

export class RazorpayWebhook {
  async create(data: any, params: Params) {
    // console.log('razorpay webhook received ==== ', JSON.stringify(data))
    try {
      const razorpayGateway = new RazorpayGateway()
      if (await razorpayGateway.validateWebhook(data, params)) {
        switch (data.event) {
          case 'payment.captured':
            await onPaymentCaptured(this.createResponsePayload(data?.payload?.payment?.entity))
            break
          case 'payment.failed':
            await onPaymentFailed(this.createResponsePayload(data?.payload?.payment?.entity))
            break
          case 'refund.processed':
            await onPaymentRefundProcessed(this.createResponsePayload(data?.payload?.refund?.entity))
            break
          default:
            return {
              success: true
            }
        }

        return { success: true }
      } else {
        throw new Error('Invalid webhook signature')
      }
    } catch (error) {
      throw error
    }
  }

  createResponsePayload(data: any): PaymentResponse {
    return {
      ...data,
      orderId: data?.notes?.orderId,
      paymentOrderId: data.order_id,
      status: data.status,
      transactionId: data.id,
      refundId: data.id,
      paymentFor: data?.notes?.paymentFor,
      couponCode: data?.notes?.couponCode,
      userSocketId: data?.notes?.userSocketId,
      orderItemId: data?.notes?.orderItemId ?? '',
      orderItemsId: data?.notes?.orderItemsId ?? '',
      type: data?.notes?.type ?? ''
    }
  }
}
