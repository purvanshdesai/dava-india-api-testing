// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  verifyPhoneOtpDataValidator,
  verifyPhoneOtpPatchValidator,
  verifyPhoneOtpQueryValidator,
  verifyPhoneOtpResolver,
  verifyPhoneOtpExternalResolver,
  verifyPhoneOtpDataResolver,
  verifyPhoneOtpPatchResolver,
  verifyPhoneOtpQueryResolver
} from './verify-phone-otp.schema'

import type { Application } from '../../declarations'
import { VerifyPhoneOtpService, getOptions } from './verify-phone-otp.class'
import { verifyPhoneOtpPath, verifyPhoneOtpMethods } from './verify-phone-otp.shared'

export * from './verify-phone-otp.class'
export * from './verify-phone-otp.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const verifyPhoneOtp = (app: Application) => {
  // Register our service on the Feathers application
  app.use(verifyPhoneOtpPath, new VerifyPhoneOtpService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: verifyPhoneOtpMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(verifyPhoneOtpPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(verifyPhoneOtpExternalResolver),
        schemaHooks.resolveResult(verifyPhoneOtpResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(verifyPhoneOtpQueryValidator),
        schemaHooks.resolveQuery(verifyPhoneOtpQueryResolver)
      ],
      create: [
        schemaHooks.validateData(verifyPhoneOtpDataValidator),
        schemaHooks.resolveData(verifyPhoneOtpDataResolver)
      ]
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
    [verifyPhoneOtpPath]: VerifyPhoneOtpService
  }
}
