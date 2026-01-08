// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import {
  ShiprocketTrackingService,
  Webhooks,
  WebhooksData,
  WebhooksPatch,
  WebhooksQuery,
  WebhooksService,
  ShiprocketQuickTrackingService
} from './webhooks.class'
import { tryCreditReferralForOrder } from '../../utils/referralValidation'
import { handleDavaCoinsPostDelivered } from '../memberships/utils'

export type { Webhooks, WebhooksData, WebhooksPatch, WebhooksQuery }

export type WebhooksClientService = Pick<
  WebhooksService<Params<WebhooksQuery>>,
  (typeof webhooksMethods)[number]
>

export const webhooksPath = 'webhooks'
export const chatBotWebhookPath = 'webhooks/chatbot'
export const shiprocketTrackingPath = 'webhooks/delivery-tracking'
export const shiprocketQuickTrackingPath = 'webhooks/hyper-local-delivery/delivery-tracking'
export const swiggyTrackingPath = 'webhooks/swiggy'
export const DelhiveryTrackingPath = 'webhooks/delhivery-tracking'

export const webhooksMethods: Array<keyof WebhooksService> = ['find', 'get', 'create', 'patch', 'remove']
export const chatBotWebhookMethods: Array<keyof WebhooksService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]
export const shiprocketTrackingMethods: Array<keyof ShiprocketTrackingService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const shiprocketQuickTrackingMethods: Array<keyof ShiprocketQuickTrackingService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const webhooksClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(webhooksPath, connection.service(webhooksPath), {
    methods: webhooksMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [webhooksPath]: WebhooksClientService
  }
}

export const handleDeliveredEvent = async (order: any) => {
  try {
    await tryCreditReferralForOrder(order?._id.toString())
    // adjust dava coins if applied and has memberhsip
    await handleDavaCoinsPostDelivered(order)
  } catch (e) {}
}
