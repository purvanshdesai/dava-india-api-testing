// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Policies, PoliciesData, PoliciesPatch, PoliciesQuery, PoliciesService } from './policies.class'

export type { Policies, PoliciesData, PoliciesPatch, PoliciesQuery }

export type PoliciesClientService = Pick<
  PoliciesService<Params<PoliciesQuery>>,
  (typeof policiesMethods)[number]
>

export const policiesPath = 'policies'

export const policiesUserPath = 'policies-user'

export const policiesMethods: Array<keyof PoliciesService> = ['find', 'get', 'create', 'patch', 'remove']

export const policiesClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(policiesPath, connection.service(policiesPath), {
    methods: policiesMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [policiesPath]: PoliciesClientService
  }
}
