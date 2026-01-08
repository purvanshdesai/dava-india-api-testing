import type { Application } from '../../declarations'
import { StoreAdminUsersService } from './store-admin-users.class'
import { storeAdminUsersPath } from './store-admin-users.shared'
import StoreAdminUsers from './routeConfig/store-admin-users'

export * from './store-admin-users.class'
export * from './store-admin-users.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const storeAdminUsers = (app: Application) => {
  // Route: /store-admin-users
  StoreAdminUsers(app)
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [storeAdminUsersPath]: StoreAdminUsersService
  }
}
