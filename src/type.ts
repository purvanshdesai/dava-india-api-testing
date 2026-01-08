import { Static, StringEnum, Type } from '@feathersjs/typebox'

export const paymentGateways = StringEnum(['razorpay'])

export type TPaymentGateways = Static<typeof paymentGateways>
