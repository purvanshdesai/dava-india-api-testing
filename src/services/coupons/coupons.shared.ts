// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Coupons, CouponsData, CouponsPatch, CouponsQuery, CouponsService } from './coupons.class'

export type { Coupons, CouponsData, CouponsPatch, CouponsQuery }

export type CouponsClientService = Pick<CouponsService<Params<CouponsQuery>>, (typeof couponsMethods)[number]>

export const couponsPath = 'coupons'
export const applyCouponPath = 'apply-coupon'
export const ConsumerCouponPath = 'consumer/coupons'

export const couponsMethods: Array<keyof CouponsService> = ['find', 'get', 'create', 'patch', 'remove']

export const couponsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(couponsPath, connection.service(couponsPath), {
    methods: couponsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [couponsPath]: CouponsClientService
  }
}
