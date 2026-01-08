import type { Application } from '../../../declarations'
import { shiprocketTrackingMethods, swiggyTrackingPath } from '../webhooks.shared'
import { getOptions, SwiggyTrackingService } from '../webhooks.class'
import { HookContext } from '@feathersjs/feathers'
import crypto from 'crypto'
import { appConfig } from '../../../utils/config'

function generateSignature(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex')
}

export const validateSignature = async (context: HookContext) => {
  const { webhookSecret } = appConfig?.logistics?.swiggy

  const { params, data } = context

  if (!params.headers || !params.headers['x-swiggy-signature']) {
    throw new Error('Missing signature')
  }

  const providedSignature = params.headers['x-swiggy-signature']

  // console.log('providedSignature', providedSignature)

  const generatedSignature = generateSignature(JSON.stringify(data), webhookSecret)

  // console.log('generatedSignature', generatedSignature)

  if (providedSignature !== generatedSignature) throw new Error('Invalid signature')

  return context
}

export const SwiggyTrackingEndPoint = (app: Application) => {
  // Register our service on the Feathers application
  app.use(swiggyTrackingPath, new SwiggyTrackingService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['create'],
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(swiggyTrackingPath).hooks({
    around: {
      all: []
    },
    before: {
      all: [],

      create: [validateSignature]
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}
