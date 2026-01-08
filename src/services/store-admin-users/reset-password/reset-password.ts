// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  storeAdminUsersResetPasswordDataValidator,
  storeAdminUsersResetPasswordPatchValidator,
  storeAdminUsersResetPasswordQueryValidator,
  storeAdminUsersResetPasswordResolver,
  storeAdminUsersResetPasswordExternalResolver,
  storeAdminUsersResetPasswordDataResolver,
  storeAdminUsersResetPasswordPatchResolver,
  storeAdminUsersResetPasswordQueryResolver
} from './reset-password.schema'

import type { Application } from '../../../declarations'
import { StoreAdminUsersResetPasswordService, getOptions } from './reset-password.class'
import {
  storeAdminUsersResetPasswordPath,
  storeAdminUsersResetPasswordMethods
} from './reset-password.shared'

export * from './reset-password.class'
export * from './reset-password.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const storeAdminUsersResetPassword = (app: Application) => {
  // Register our service on the Feathers application
  app.use(storeAdminUsersResetPasswordPath, new StoreAdminUsersResetPasswordService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: storeAdminUsersResetPasswordMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(storeAdminUsersResetPasswordPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(storeAdminUsersResetPasswordExternalResolver),
        schemaHooks.resolveResult(storeAdminUsersResetPasswordResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(storeAdminUsersResetPasswordQueryValidator),
        schemaHooks.resolveQuery(storeAdminUsersResetPasswordQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(storeAdminUsersResetPasswordDataValidator),
        schemaHooks.resolveData(storeAdminUsersResetPasswordDataResolver)
      ],
      patch: [
        schemaHooks.validateData(storeAdminUsersResetPasswordPatchValidator),
        schemaHooks.resolveData(storeAdminUsersResetPasswordPatchResolver)
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
    [storeAdminUsersResetPasswordPath]: StoreAdminUsersResetPasswordService
  }
}
