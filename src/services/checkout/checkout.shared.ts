// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Checkout, CheckoutData, CheckoutPatch, CheckoutQuery, CheckoutService } from './checkout.class'

export type { Checkout, CheckoutData, CheckoutPatch, CheckoutQuery }

export type CheckoutClientService = Pick<
  CheckoutService<Params<CheckoutQuery>>,
  (typeof checkoutMethods)[number]
>

export const checkoutPath = 'order/:orderId/checkout'

export const checkoutMethods: Array<keyof CheckoutService> = ['find', 'get', 'create', 'patch', 'remove']

export const checkoutClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(checkoutPath, connection.service(checkoutPath), {
    methods: checkoutMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [checkoutPath]: CheckoutClientService
  }
}
