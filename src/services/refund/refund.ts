// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  refundDataValidator,
  refundPatchValidator,
  refundQueryValidator,
  refundResolver,
  refundExternalResolver,
  refundDataResolver,
  refundPatchResolver,
  refundQueryResolver
} from './refund.schema'

import type { Application } from '../../declarations'
import { RefundService, getOptions } from './refund.class'
import { refundPath, refundMethods } from './refund.shared'

export * from './refund.class'
export * from './refund.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const refund = (app: Application) => {
  // Register our service on the Feathers application
  app.use(refundPath, new RefundService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: refundMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(refundPath).hooks({
    around: {
      all: [schemaHooks.resolveExternal(refundExternalResolver), schemaHooks.resolveResult(refundResolver)]
    },
    before: {
      all: [schemaHooks.validateQuery(refundQueryValidator), schemaHooks.resolveQuery(refundQueryResolver)]
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [refundPath]: RefundService
  }
}
