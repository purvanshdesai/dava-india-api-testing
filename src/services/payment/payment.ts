// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'
import { authenticate } from '@feathersjs/authentication'

import {
  paymentDataValidator,
  paymentPatchValidator,
  paymentQueryValidator,
  paymentResolver,
  paymentExternalResolver,
  paymentDataResolver,
  paymentPatchResolver,
  paymentQueryResolver
} from './payment.schema'

import type { Application } from '../../declarations'
import {
  PaymentService,
  VerifyPaymentService,
  PayuPaymentDynamicHashCreationService,
  getOptions
} from './payment.class'
import {
  paymentPath,
  verifyPaymentPath,
  paymentDynamicHashCreationPath,
  paymentMethods,
  razorpayWebhookPath,
  payuWebhookPath
} from './payment.shared'
import { RazorpayWebhook } from './webhooks/razorpay'
import { PayUWebhook } from './webhooks/payu'

export * from './payment.class'
export * from './payment.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const payment = (app: Application) => {
  // Register our service on the Feathers application
  app.use(paymentPath, new PaymentService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: paymentMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })

  // Verify payment
  app.use(verifyPaymentPath, new VerifyPaymentService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['create'],
    // You can add additional custom events to be sent to clients here
    events: []
  })

  // Verify payment
  app.use(paymentDynamicHashCreationPath, new PayuPaymentDynamicHashCreationService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['create'],
    // You can add additional custom events to be sent to clients here
    events: []
  })

  // Payment Webhooks
  app.use(razorpayWebhookPath, new RazorpayWebhook())
  app.use(payuWebhookPath, new PayUWebhook())

  // Initialize hooks
  app.service(paymentPath).hooks({
    around: {
      all: [schemaHooks.resolveExternal(paymentExternalResolver), schemaHooks.resolveResult(paymentResolver)]
    },
    before: {
      all: [schemaHooks.validateQuery(paymentQueryValidator), schemaHooks.resolveQuery(paymentQueryResolver)],
      find: [],
      get: [],
      create: [schemaHooks.validateData(paymentDataValidator), schemaHooks.resolveData(paymentDataResolver)],
      patch: [schemaHooks.validateData(paymentPatchValidator), schemaHooks.resolveData(paymentPatchResolver)],
      remove: []
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })

  app.service(verifyPaymentPath).hooks({
    around: {
      all: [authenticate('jwt')]
    }
  })

  app.service(paymentDynamicHashCreationPath).hooks({
    around: {
      all: [authenticate('jwt')]
    }
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [paymentPath]: PaymentService
    [verifyPaymentPath]: VerifyPaymentService
    [paymentDynamicHashCreationPath]: PayuPaymentDynamicHashCreationService
    ['/payment/webhook/razorpay']: RazorpayWebhook
    ['/payment/webhook/payu']: PayUWebhook
  }
}
