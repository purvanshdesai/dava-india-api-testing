// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  UserAddresses,
  UserAddressesData,
  UserAddressesPatch,
  UserAddressesQuery,
  UserAddressesService
} from './user-addresses.class'
import { HookContext } from '../../declarations'

export type { UserAddresses, UserAddressesData, UserAddressesPatch, UserAddressesQuery }

export type UserAddressesClientService = Pick<
  UserAddressesService<Params<UserAddressesQuery>>,
  (typeof userAddressesMethods)[number]
>

export const userAddressesPath = 'user-addresses'

export const userAddressesMethods: Array<keyof UserAddressesService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const userAddressesClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(userAddressesPath, connection.service(userAddressesPath), {
    methods: userAddressesMethods
  })
}

// Hook to set date fields
export const setTimestamp = async (context: HookContext) => {
  const { data, method } = context
  if (method === 'create') {
    data.createdAt = new Date().toISOString()
  }
  data.updatedAt = new Date().toISOString()
  return context
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [userAddressesPath]: UserAddressesClientService
  }
}
