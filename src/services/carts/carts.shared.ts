// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Carts, CartsData, CartsPatch, CartsQuery, CartsService } from './carts.class'
import { HookContext } from '../../declarations'

export type { Carts, CartsData, CartsPatch, CartsQuery }

export type CartsClientService = Pick<CartsService<Params<CartsQuery>>, (typeof cartsMethods)[number]>

export const cartsPath = 'carts'
export const cartsProductVerificationPath = 'carts/verify-product'
export const cartsCheckOneDayDeliveryPath = 'carts/check-one-day-delivery'

export const cartsMethods: Array<keyof CartsService> = ['find', 'get', 'create', 'patch', 'remove']

export const cartsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(cartsPath, connection.service(cartsPath), {
    methods: cartsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [cartsPath]: CartsClientService
  }
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
