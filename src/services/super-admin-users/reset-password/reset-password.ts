// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  superAdminUsersDataValidator,
  superAdminUsersPatchValidator,
  superAdminUsersQueryValidator,
  superAdminUsersResolver,
  superAdminUsersExternalResolver,
  superAdminUsersDataResolver,
  superAdminUsersPatchResolver,
  superAdminUsersQueryResolver
} from './reset-password.schema'

import type { Application } from '../../../declarations'
import { SuperAdminUsersService, getOptions } from './reset-password.class'
import { superAdminUsersPath, superAdminUsersMethods } from './reset-password.shared'

export * from './reset-password.class'
export * from './reset-password.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const superAdminUsersResetPassword = (app: Application) => {
  // Register our service on the Feathers application
  app.use(superAdminUsersPath, new SuperAdminUsersService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: superAdminUsersMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(superAdminUsersPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(superAdminUsersExternalResolver),
        schemaHooks.resolveResult(superAdminUsersResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(superAdminUsersQueryValidator),
        schemaHooks.resolveQuery(superAdminUsersQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(superAdminUsersDataValidator),
        schemaHooks.resolveData(superAdminUsersDataResolver)
      ],
      patch: [
        schemaHooks.validateData(superAdminUsersPatchValidator),
        schemaHooks.resolveData(superAdminUsersPatchResolver)
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
    [superAdminUsersPath]: SuperAdminUsersService
  }
}
