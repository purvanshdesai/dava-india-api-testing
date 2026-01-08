// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  storeAdminUsersDataValidator,
  storeAdminUsersPatchValidator,
  storeAdminUsersQueryValidator,
  storeAdminUsersResolver,
  storeAdminUsersExternalResolver,
  storeAdminUsersDataResolver,
  storeAdminUsersPatchResolver,
  storeAdminUsersQueryResolver
} from '../store-admin-users.schema'

import { Application } from '../../../declarations'
import { StoreAdminUsersService, getOptions } from '../store-admin-users.class'
import { storeAdminUsersPath, storeAdminUsersMethods } from '../store-admin-users.shared'

export default function StoreAdminUsers(app: Application) {
  // Register our service on the Feathers application
  app.use(storeAdminUsersPath, new StoreAdminUsersService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: storeAdminUsersMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(storeAdminUsersPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'store-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(storeAdminUsersExternalResolver),
        schemaHooks.resolveResult(storeAdminUsersResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(storeAdminUsersQueryValidator),
        schemaHooks.resolveQuery(storeAdminUsersQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(storeAdminUsersDataValidator),
        schemaHooks.resolveData(storeAdminUsersDataResolver)
      ],
      patch: [
        schemaHooks.validateData(storeAdminUsersPatchValidator),
        schemaHooks.resolveData(storeAdminUsersPatchResolver)
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
