// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Memberships,
  MembershipsData,
  MembershipsPatch,
  MembershipsQuery,
  MembershipsService
} from './memberships.class'
import { HookContext } from '../../declarations'

export type { Memberships, MembershipsData, MembershipsPatch, MembershipsQuery }

export type MembershipsClientService = Pick<
  MembershipsService<Params<MembershipsQuery>>,
  (typeof membershipsMethods)[number]
>

export const membershipsPath = 'memberships'

export const membershipsMethods: Array<keyof MembershipsService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const membershipsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(membershipsPath, connection.service(membershipsPath), {
    methods: membershipsMethods
  })
}

export const setTimestamp = async (context: HookContext) => {
  const { data, method } = context
  // console.log('data', data)
  if (method === 'create') {
    data.createdAt = new Date().toISOString()
  }
  data.updatedAt = new Date().toISOString()
  return context
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [membershipsPath]: MembershipsClientService
  }
}

export const membershipConfig: {
  FREE_DELIVERY_PRICE: number
  FREE_DELIVERY_COUNT: number
  membershipAmount: number
} = {
  FREE_DELIVERY_PRICE: 299,
  FREE_DELIVERY_COUNT: 25,
  membershipAmount: 99
}
