// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  MembershipOrders,
  MembershipOrdersData,
  MembershipOrdersPatch,
  MembershipOrdersQuery,
  MembershipOrdersService
} from './membership-orders.class'
import { HookContext } from '../../declarations'
import { MembershipOrderModel } from './membership-orders.schema'
import { PaymentModel } from '../payment/payment.schema'
import { PAYMENT_GATEWAY_MAPPER, PAYMENT_GATEWAYS, PaymentGatewayType } from '../../payments'

export type { MembershipOrders, MembershipOrdersData, MembershipOrdersPatch, MembershipOrdersQuery }

export type MembershipOrdersClientService = Pick<
  MembershipOrdersService<Params<MembershipOrdersQuery>>,
  (typeof membershipOrdersMethods)[number]
>

export const membershipOrdersPath = 'membership-orders'

export const membershipOrdersMethods: Array<keyof MembershipOrdersService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const membershipOrdersClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(membershipOrdersPath, connection.service(membershipOrdersPath), {
    methods: membershipOrdersMethods
  })
}

export const setTimestamp = async (context: HookContext) => {
  const { data, method } = context

  if (method === 'create') {
    data.createdAt = new Date().toISOString()
  }
  data.updatedAt = new Date().toISOString()
  return context
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [membershipOrdersPath]: MembershipOrdersClientService
  }
}

export const createCheckoutSession = async ({ order, data, user }: any) => {
  const paymentMode: PaymentGatewayType = PAYMENT_GATEWAYS.PAYU // payu by default
  const paymentGateway = new PAYMENT_GATEWAY_MAPPER[paymentMode]()

  const paymentInfo = await paymentGateway.initOrder({
    currency: 'INR',
    paymentAmount: order?.paymentAmount,
    userId: user?._id?.toString(),
    userSocketId: data?.userSocketId,
    paymentType: 'online',
    paymentFor: 'membership',
    orderId: order?._id?.toString(),
    productInfo: 'Davaone Membership',
    email: user?.email,
    customerName: user?.name,
    phone: user?.phoneNumber,
    deviceType: order?.deviceType
  })

  await MembershipOrderModel.findByIdAndUpdate(order._id, { paymentOrderId: paymentInfo.id })

  await PaymentModel.create({
    amount: order.paymentAmount,
    currency: order.currency,
    membershipOrder: order?._id,
    paymentGateway: order.paymentMode,
    status: 'pending',
    paymentFor: 'membership',
    paymentOrderId: paymentInfo.id
  })

  return paymentInfo
}
