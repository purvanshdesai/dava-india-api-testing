// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Payment, PaymentData, PaymentPatch, PaymentQuery, PaymentService } from './payment.class'
import { PAYMENT_GATEWAY_MAPPER, PaymentGatewayType } from '../../payments'

export type { Payment, PaymentData, PaymentPatch, PaymentQuery }

export type PaymentClientService = Pick<PaymentService<Params<PaymentQuery>>, (typeof paymentMethods)[number]>

export const paymentPath = 'payment'
export const verifyPaymentPath = 'verify-payment'
export const paymentDynamicHashCreationPath = 'payment/payu/dynamic-hash'
export const razorpayWebhookPath = '/payment/webhook/razorpay'
export const payuWebhookPath = '/payment/webhook/payu'

export const paymentMethods: Array<keyof PaymentService> = ['find', 'get', 'create', 'patch', 'remove']

export const paymentClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(paymentPath, connection.service(paymentPath), {
    methods: paymentMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [paymentPath]: PaymentClientService
  }
}

export function getPaymentGateway(type: PaymentGatewayType) {
  const GatewayClass = PAYMENT_GATEWAY_MAPPER[type]
  return new GatewayClass()
}
