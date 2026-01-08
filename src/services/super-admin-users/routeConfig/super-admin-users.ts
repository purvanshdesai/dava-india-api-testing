import { Application } from '../../../declarations'
// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

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
} from '../super-admin-users.schema'

import { SuperAdminUsersService, getOptions } from '../super-admin-users.class'
import { superAdminUsersPath, superAdminUsersMethods } from '../super-admin-users.shared'

export default function SuperAdminUsers(app: Application) {
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
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
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
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
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
