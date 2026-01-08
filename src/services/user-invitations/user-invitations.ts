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
} from './user-invitations.schema'

import type { Application } from '../../declarations'
import { StoreAdminService, UserInvitationsService, getOptions } from './user-invitations.class'
import {
  userInvitationsPath,
  userInvitationsMethods,
  storeAdminInvitationsPath
} from './user-invitations.shared'
import { superAdminInvitations } from './routeConfig/super-admin'
import { storeAdminInvitations } from './routeConfig/store-admin'

export * from './user-invitations.class'
export * from './user-invitations.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const userInvitations = (app: Application) => {
  superAdminInvitations(app)
  storeAdminInvitations(app)
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [userInvitationsPath]: UserInvitationsService
    [storeAdminInvitationsPath]: StoreAdminService
  }
}
