// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  resendStoreInviteDataValidator,
  resendStoreInvitePatchValidator,
  resendStoreInviteQueryValidator,
  resendStoreInviteResolver,
  resendStoreInviteExternalResolver,
  resendStoreInviteDataResolver,
  resendStoreInvitePatchResolver,
  resendStoreInviteQueryResolver
} from './resend-store-invite.schema'

import type { Application } from '../../declarations'
import { ResendStoreInviteService, getOptions } from './resend-store-invite.class'
import { resendStoreInvitePath, resendStoreInviteMethods } from './resend-store-invite.shared'

export * from './resend-store-invite.class'
export * from './resend-store-invite.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const resendStoreInvite = (app: Application) => {
  // Register our service on the Feathers application
  app.use(resendStoreInvitePath, new ResendStoreInviteService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: resendStoreInviteMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(resendStoreInvitePath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(resendStoreInviteExternalResolver),
        schemaHooks.resolveResult(resendStoreInviteResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(resendStoreInviteQueryValidator),
        schemaHooks.resolveQuery(resendStoreInviteQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(resendStoreInviteDataValidator),
        schemaHooks.resolveData(resendStoreInviteDataResolver)
      ],
      patch: [
        schemaHooks.validateData(resendStoreInvitePatchValidator),
        schemaHooks.resolveData(resendStoreInvitePatchResolver)
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
declare module '../../declarations' {
  interface ServiceTypes {
    [resendStoreInvitePath]: ResendStoreInviteService
  }
}
