// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import type { Application } from '../../declarations'
import {
  WebhooksService,
  ChatBotWebhooksService,
  ShiprocketTrackingService,
  ShiprocketQuickTrackingService,
  SwiggyTrackingService,
  DelhiveryTrackingService
} from './webhooks.class'
import {
  webhooksPath,
  chatBotWebhookPath,
  shiprocketTrackingPath,
  shiprocketQuickTrackingPath,
  swiggyTrackingPath,
  DelhiveryTrackingPath
} from './webhooks.shared'
import { GenericWebhooks } from './routeConfig/generic'
import { ChatBotWebhook } from './routeConfig/chatBot'
import { ShiprocketTrackingEndPoint } from './routeConfig/shiprocketTracking'
import { ShiprocketQuickTrackingEndPoint } from './routeConfig/shiprocketQuickTracking'
import { SwiggyTrackingEndPoint } from './routeConfig/swiggyTracking'
import { DelhiveryTrackingEndPoint } from './routeConfig/DelhiveryTracking'

export * from './webhooks.class'
export * from './webhooks.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const webhooks = (app: Application) => {
  GenericWebhooks(app)
  ChatBotWebhook(app)
  ShiprocketTrackingEndPoint(app)
  ShiprocketQuickTrackingEndPoint(app)
  SwiggyTrackingEndPoint(app)
  DelhiveryTrackingEndPoint(app)
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [webhooksPath]: WebhooksService
    [chatBotWebhookPath]: ChatBotWebhooksService
    [shiprocketTrackingPath]: ShiprocketTrackingService
    [shiprocketQuickTrackingPath]: ShiprocketQuickTrackingService
    [swiggyTrackingPath]: SwiggyTrackingService
    [DelhiveryTrackingPath]: DelhiveryTrackingService
  }
}
