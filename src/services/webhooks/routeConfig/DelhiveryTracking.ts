import type { Application } from '../../../declarations'
import { DelhiveryTrackingPath } from '../webhooks.shared'
import { getOptions, DelhiveryTrackingService } from '../webhooks.class'
import { HookContext } from '@feathersjs/feathers'
import crypto from 'crypto'
import { appConfig } from '../../../utils/config'

function generateSignature(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex')
}

export const validateSignature = async (context: HookContext) => {
  const { webhookSecret } = appConfig?.logistics?.delhivery ?? {}

  const { params, data } = context

  if (!params.headers || !params.headers['x-delhivery-signature']) {
    throw new Error('Missing signature')
  }

  const providedSignature = params.headers['x-delhivery-signature']

  // console.log('providedSignature', providedSignature)

  // const generatedSignature = generateSignature(JSON.stringify(data), webhookSecret)

  // console.log('generatedSignature', generatedSignature)

  if (providedSignature !== webhookSecret) throw new Error('Invalid signature')

  return context
}

export const DelhiveryTrackingEndPoint = (app: Application) => {
  // Register our service on the Feathers application
  app.use(DelhiveryTrackingPath, new DelhiveryTrackingService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['create'],
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(DelhiveryTrackingPath).hooks({
    around: {
      all: []
    },
    before: {
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
