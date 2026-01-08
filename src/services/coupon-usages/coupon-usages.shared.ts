// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  CouponUsages,
  CouponUsagesData,
  CouponUsagesPatch,
  CouponUsagesQuery,
  CouponUsagesService
} from './coupon-usages.class'

export type { CouponUsages, CouponUsagesData, CouponUsagesPatch, CouponUsagesQuery }

export type CouponUsagesClientService = Pick<
  CouponUsagesService<Params<CouponUsagesQuery>>,
  (typeof couponUsagesMethods)[number]
>

export const couponUsagesPath = 'coupon-usages'

export const couponUsagesMethods: Array<keyof CouponUsagesService> = ['find', 'create']

export const couponUsagesClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(couponUsagesPath, connection.service(couponUsagesPath), {
    methods: couponUsagesMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [couponUsagesPath]: CouponUsagesClientService
  }
}
