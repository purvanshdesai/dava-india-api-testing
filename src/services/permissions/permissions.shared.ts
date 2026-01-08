// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Permissions,
  PermissionsData,
  PermissionsPatch,
  PermissionsQuery,
  PermissionsService
} from './permissions.class'

export type { Permissions, PermissionsData, PermissionsPatch, PermissionsQuery }

export type PermissionsClientService = Pick<
  PermissionsService<Params<PermissionsQuery>>,
  (typeof permissionsMethods)[number]
>

export const permissionsPath = 'permissions'

export const permissionsMethods: Array<keyof PermissionsService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const permissionsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(permissionsPath, connection.service(permissionsPath), {
    methods: permissionsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [permissionsPath]: PermissionsClientService
  }
}
