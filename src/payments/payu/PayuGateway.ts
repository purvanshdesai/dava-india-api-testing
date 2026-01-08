import { TOrderDetails, PaymentGateway } from '../PaymentType'
import crypto from 'crypto'
import { appConfig } from '../../utils/config'
import { BadRequest } from '@feathersjs/errors'
const PayU = require('payu-websdk')

export class PayUPaymentGateway extends PaymentGateway {
  private static instance: PayUPaymentGateway
  config: any
  payuClient: any

  constructor() {
    super()
    this.config = appConfig?.payu ?? {}

    // create a client

    this.payuClient = new PayU(
      {
        key: this.config.merchantKey,
        salt: this.config.merchantSalt
      },
      this.config.env
    )

    if (PayUPaymentGateway.instance) {
      return PayUPaymentGateway.instance
    }
    PayUPaymentGateway.instance = this
  }

  async initOrder(orderData: TOrderDetails): Promise<any> {
    try {
      const { paymentAmount, productInfo, customerName, email, phone, deviceType } = orderData
      const udf1 = orderData.paymentFor ?? 'order'
      const udf2 = orderData.paymentType ?? ''
      const udf3 = orderData.deviceType ?? ''
      const udf4 = orderData.orderId ?? ''
      const udf5 = orderData.couponCode ?? ''

      // Generate transaction ID
      const txnId = `TXN${Date.now()}${Math.random().toString(36).substring(7).toUpperCase()}`

      const hashString = `${this.config.merchantKey}|${txnId}|${paymentAmount}|${productInfo}|${customerName}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${this.config.merchantSalt}`

      const hash = crypto.createHash('sha512').update(hashString).digest('hex')

      let sUrl, fUrl

      if (['android', 'ios'].includes(deviceType ?? '')) {
        sUrl = this.config.mobileSurl
        fUrl = this.config.mobileFurl
      } else {
        // Prepare PayU form data
        const callbackParams = `?txnId=${txnId}&orderId=${orderData.orderId}&paymentFor=${udf1}`

        sUrl = this.config.successUrl + callbackParams
        fUrl = this.config.failureUrl + callbackParams
      }

      const paymentDetails = {
        isAmountFilledByCustomer: false,
        key: this.config.merchantKey,
        txnid: txnId,
        amount: paymentAmount,
        currency: 'INR',
        productinfo: productInfo,
        firstname: customerName,
        email,
        phone,
        surl: sUrl,
        furl: fUrl,
        udf1,
        udf2,
        udf3,
        udf4,
        udf5,
        hash
      }

      const paymentForm = this.payuClient.paymentInitiate(paymentDetails)

      return { paymentForm, id: txnId, paymentDetails }
    } catch (error) {
      throw error
    }
  }

  async verifyPayment(data: any): Promise<any> {
    const verified_Data = await this.payuClient.verifyPayment(data.txnid)

    const payment = verified_Data?.transaction_details[data.txnid]

    if (!payment) throw new BadRequest('Payu payment: Payment not found!')

    return payment
  }

  async refundPayment(transactionId: string, amount: number, opts?: any): Promise<any> {
    try {
      // const refundAmount = Math.round(amount * 100) / 100
      const refundAmount = Math.floor(amount)

      console.log('🚀 ~ PayUPaymentGateway ~ refundPayment ~ refundAmount:', refundAmount.toString())

      const res = await this.payuClient?.cancelRefundTransaction(
        transactionId,
        this.generateRefundTokenId(),
        refundAmount?.toString()
      )

      if ((res && res?.status === 0) || res?.error_code !== 102)
        throw new Error(res?.msg ?? 'Error while refund a transaction!')

      return {
        refundId: res?.request_id,
        status: res?.error_code === 102 ? 'processed' : 'failed'
      }
    } catch (e) {
      throw e
    }
  }

  generateRefundHash(key: string, command: string, var1: string, salt: string) {
    const hashString = `${key}|${command}|${var1}|${salt}`
    return crypto.createHash('sha512').update(hashString).digest('hex')
  }

  generateRefundTokenId() {
    const timestamp = Date.now() // milliseconds since epoch
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase() // 6 random alphanumeric characters
    return `REF_${timestamp}_${randomPart}`
  }

  createPaymentResponsePayload(data: any) {
    return {
      ...data,
      paymentFor: data?.udf1 ?? 'order',
      paymentType: data?.udf2,
      deviceType: data?.udf3,
      orderId: data?.udf4,
      couponCode: data?.udf5,
      paymentOrderId: data.txnid,
      transactionId: data.mihpayid,
      status: data.status === 'failure' ? 'failed' : data.status === 'success' ? 'captured' : 'other',
      paymentStatus: data?.unmappedstatus ?? ''
    }
  }

  generateDynamicHash(hashStringWithoutSalt: string): string {
    const hash = crypto.createHash('sha512').update(hashStringWithoutSalt).digest('hex')

    return hash
  }
}
