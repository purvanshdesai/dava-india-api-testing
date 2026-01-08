// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  storeAdminUsersForgotPasswordDataValidator,
  storeAdminUsersForgotPasswordPatchValidator,
  storeAdminUsersForgotPasswordQueryValidator,
  storeAdminUsersForgotPasswordResolver,
  storeAdminUsersForgotPasswordExternalResolver,
  storeAdminUsersForgotPasswordDataResolver,
  storeAdminUsersForgotPasswordPatchResolver,
  storeAdminUsersForgotPasswordQueryResolver
} from './forgot-password.schema'

import type { Application } from '../../../declarations'
import { StoreAdminUsersForgotPasswordService, getOptions } from './forgot-password.class'
import {
  storeAdminUsersForgotPasswordPath,
  storeAdminUsersForgotPasswordMethods
} from './forgot-password.shared'

export * from './forgot-password.class'
export * from './forgot-password.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const storeAdminUsersForgotPassword = (app: Application) => {
  // Register our service on the Feathers application
  app.use(storeAdminUsersForgotPasswordPath, new StoreAdminUsersForgotPasswordService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: storeAdminUsersForgotPasswordMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(storeAdminUsersForgotPasswordPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(storeAdminUsersForgotPasswordExternalResolver),
        schemaHooks.resolveResult(storeAdminUsersForgotPasswordResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(storeAdminUsersForgotPasswordQueryValidator),
        schemaHooks.resolveQuery(storeAdminUsersForgotPasswordQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(storeAdminUsersForgotPasswordDataValidator),
        schemaHooks.resolveData(storeAdminUsersForgotPasswordDataResolver)
      ],
      patch: [
        schemaHooks.validateData(storeAdminUsersForgotPasswordPatchValidator),
        schemaHooks.resolveData(storeAdminUsersForgotPasswordPatchResolver)
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
    [storeAdminUsersForgotPasswordPath]: StoreAdminUsersForgotPasswordService
  }
}
