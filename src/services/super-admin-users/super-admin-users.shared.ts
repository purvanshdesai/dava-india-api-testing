// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  SuperAdminUsers,
  SuperAdminUsersData,
  SuperAdminUsersPatch,
  SuperAdminUsersQuery,
  SuperAdminUsersService
} from './super-admin-users.class'

export type { SuperAdminUsers, SuperAdminUsersData, SuperAdminUsersPatch, SuperAdminUsersQuery }

export type SuperAdminUsersClientService = Pick<
  SuperAdminUsersService<Params<SuperAdminUsersQuery>>,
  (typeof superAdminUsersMethods)[number]
>

export const superAdminUsersPath = 'super-admin-users'
export const invitedSuperAdminUsersPath = 'super-admin-users/invitations'

export const superAdminUsersMethods: Array<keyof SuperAdminUsersService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const superAdminUsersClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(superAdminUsersPath, connection.service(superAdminUsersPath), {
    methods: superAdminUsersMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [superAdminUsersPath]: SuperAdminUsersClientService
  }
}
