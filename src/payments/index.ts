import { PayUPaymentGateway } from './payu/PayuGateway'
import { RazorpayGateway } from './razorpay/RazorpayGateway'

export const PAYMENT_GATEWAYS = {
  PAYU: 'payu',
  RAZORPAY: 'razorpay'
} as const

export const PAYMENT_GATEWAY_MAPPER = {
  razorpay: RazorpayGateway,
  payu: PayUPaymentGateway
}

export type PaymentGatewayType = keyof typeof PAYMENT_GATEWAY_MAPPER
