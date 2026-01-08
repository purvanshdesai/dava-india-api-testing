// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  userInvitationsDataValidator,
  userInvitationsPatchValidator,
  userInvitationsQueryValidator,
  userInvitationsResolver,
  userInvitationsExternalResolver,
  userInvitationsDataResolver,
  userInvitationsPatchResolver,
  userInvitationsQueryResolver
} from '../user-invitations.schema'

import type { Application } from '../../../declarations'
import { StoreAdminService, UserInvitationsService, getOptions } from '../user-invitations.class'
import { storeAdminInvitationsPath, userInvitationsPath } from '../user-invitations.shared'

export * from '../user-invitations.class'
export * from '../user-invitations.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const storeAdminInvitations = (app: Application) => {
  // Register our service on the Feathers application
  app.use(storeAdminInvitationsPath, new StoreAdminService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['create', 'get', 'find', 'remove', 'patch'],
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(userInvitationsPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(userInvitationsExternalResolver),
        schemaHooks.resolveResult(userInvitationsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(userInvitationsQueryValidator),
        schemaHooks.resolveQuery(userInvitationsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(userInvitationsDataValidator),
        schemaHooks.resolveData(userInvitationsDataResolver)
      ],
      patch: [
        schemaHooks.validateData(userInvitationsPatchValidator),
        schemaHooks.resolveData(userInvitationsPatchResolver)
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
