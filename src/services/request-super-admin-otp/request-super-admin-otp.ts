// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  requestSuperAdminOtpDataValidator,
  requestSuperAdminOtpPatchValidator,
  requestSuperAdminOtpQueryValidator,
  requestSuperAdminOtpResolver,
  requestSuperAdminOtpExternalResolver,
  requestSuperAdminOtpDataResolver,
  requestSuperAdminOtpPatchResolver,
  requestSuperAdminOtpQueryResolver
} from './request-super-admin-otp.schema'

import type { Application } from '../../declarations'
import { RequestSuperAdminOtpService, getOptions } from './request-super-admin-otp.class'
import { requestSuperAdminOtpPath, requestSuperAdminOtpMethods } from './request-super-admin-otp.shared'

export * from './request-super-admin-otp.class'
export * from './request-super-admin-otp.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const requestSuperAdminOtp = (app: Application) => {
  // Register our service on the Feathers application
  app.use(requestSuperAdminOtpPath, new RequestSuperAdminOtpService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: requestSuperAdminOtpMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(requestSuperAdminOtpPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(requestSuperAdminOtpExternalResolver),
        schemaHooks.resolveResult(requestSuperAdminOtpResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(requestSuperAdminOtpQueryValidator),
        schemaHooks.resolveQuery(requestSuperAdminOtpQueryResolver)
      ],
      create: [
        schemaHooks.validateData(requestSuperAdminOtpDataValidator),
        schemaHooks.resolveData(requestSuperAdminOtpDataResolver)
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
    [requestSuperAdminOtpPath]: RequestSuperAdminOtpService
  }
}
