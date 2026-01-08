// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  superAdminUserForgotPasswordDataValidator,
  superAdminUserForgotPasswordPatchValidator,
  superAdminUserForgotPasswordQueryValidator,
  superAdminUserForgotPasswordResolver,
  superAdminUserForgotPasswordExternalResolver,
  superAdminUserForgotPasswordDataResolver,
  superAdminUserForgotPasswordPatchResolver,
  superAdminUserForgotPasswordQueryResolver
} from './forgot-password.schema'

import type { Application } from '../../../declarations'
import { SuperAdminUserForgotPasswordService, getOptions } from './forgot-password.class'
import {
  superAdminUserForgotPasswordPath,
  superAdminUserForgotPasswordMethods
} from './forgot-password.shared'

export * from './forgot-password.class'
export * from './forgot-password.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const superAdminUserForgotPassword = (app: Application) => {
  // Register our service on the Feathers application
  app.use(superAdminUserForgotPasswordPath, new SuperAdminUserForgotPasswordService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: superAdminUserForgotPasswordMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(superAdminUserForgotPasswordPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(superAdminUserForgotPasswordExternalResolver),
        schemaHooks.resolveResult(superAdminUserForgotPasswordResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(superAdminUserForgotPasswordQueryValidator),
        schemaHooks.resolveQuery(superAdminUserForgotPasswordQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(superAdminUserForgotPasswordDataValidator),
        schemaHooks.resolveData(superAdminUserForgotPasswordDataResolver)
      ],
      patch: [
        schemaHooks.validateData(superAdminUserForgotPasswordPatchValidator),
        schemaHooks.resolveData(superAdminUserForgotPasswordPatchResolver)
      ],
      remove: []
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
declare module '../../../declarations' {
  interface ServiceTypes {
    [superAdminUserForgotPasswordPath]: SuperAdminUserForgotPasswordService
  }
}
