// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  DeliveryPolicies,
  DeliveryPoliciesData,
  DeliveryPoliciesPatch,
  DeliveryPoliciesQuery,
  DeliveryPoliciesService
} from './delivery-policies.class'

export type { DeliveryPolicies, DeliveryPoliciesData, DeliveryPoliciesPatch, DeliveryPoliciesQuery }

export type DeliveryPoliciesClientService = Pick<
  DeliveryPoliciesService<Params<DeliveryPoliciesQuery>>,
  (typeof deliveryPoliciesMethods)[number]
>

export const deliveryPoliciesPath = 'delivery-policies'
export const deliveryModeTemplatesPath = 'delivery-mode-templates'

export const deliveryPoliciesMethods: Array<keyof DeliveryPoliciesService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const deliveryPoliciesClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(deliveryPoliciesPath, connection.service(deliveryPoliciesPath), {
    methods: deliveryPoliciesMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [deliveryPoliciesPath]: DeliveryPoliciesClientService
  }
}
