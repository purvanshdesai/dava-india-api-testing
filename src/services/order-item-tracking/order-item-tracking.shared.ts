// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  OrderItemTracking,
  OrderItemTrackingData,
  OrderItemTrackingPatch,
  OrderItemTrackingQuery,
  OrderItemTrackingService
} from './order-item-tracking.class'

export type { OrderItemTracking, OrderItemTrackingData, OrderItemTrackingPatch, OrderItemTrackingQuery }

export type OrderItemTrackingClientService = Pick<
  OrderItemTrackingService<Params<OrderItemTrackingQuery>>,
  (typeof orderItemTrackingMethods)[number]
>

export const orderItemTrackingPath = 'order-item-tracking'

export const orderItemTrackingMethods: Array<keyof OrderItemTrackingService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const orderItemTrackingClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(orderItemTrackingPath, connection.service(orderItemTrackingPath), {
    methods: orderItemTrackingMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [orderItemTrackingPath]: OrderItemTrackingClientService
  }
}
