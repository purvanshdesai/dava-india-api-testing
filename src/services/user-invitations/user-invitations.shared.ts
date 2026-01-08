// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  StoreAdminService,
  UserInvitations,
  UserInvitationsData,
  UserInvitationsPatch,
  UserInvitationsQuery,
  UserInvitationsService
} from './user-invitations.class'

export type { UserInvitations, UserInvitationsData, UserInvitationsPatch, UserInvitationsQuery }

export type UserInvitationsClientService = Pick<
  UserInvitationsService<Params<UserInvitationsQuery>>,
  (typeof userInvitationsMethods)[number]
>

export const userInvitationsPath = 'user-invitations'
export const storeAdminInvitationsPath = 'store-admin/invitations'

export const userInvitationsMethods: Array<keyof UserInvitationsService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const userInvitationsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(userInvitationsPath, connection.service(userInvitationsPath), {
    methods: userInvitationsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [userInvitationsPath]: UserInvitationsClientService
    [storeAdminInvitationsPath]: StoreAdminService
  }
}
