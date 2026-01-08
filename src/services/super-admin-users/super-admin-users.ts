import type { Application } from '../../declarations'
import { SuperAdminUsersService, InvitedSuperAdminUsersService } from './super-admin-users.class'
import { superAdminUsersPath, invitedSuperAdminUsersPath } from './super-admin-users.shared'
import SuperAdminUsers from './routeConfig/super-admin-users'
import InvitedSuperAdminUsers from './routeConfig/invited-super-admin-users'

export * from './super-admin-users.class'
export * from './super-admin-users.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const superAdminUsers = (app: Application) => {
  // Route: /super-admin-users
  SuperAdminUsers(app)

  // Route: /super-admin-users/invitations
  InvitedSuperAdminUsers(app)
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [superAdminUsersPath]: SuperAdminUsersService
    [invitedSuperAdminUsersPath]: InvitedSuperAdminUsersService
  }
}
