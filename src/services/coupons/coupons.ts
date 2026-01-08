// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  couponsDataValidator,
  couponsPatchValidator,
  couponsQueryValidator,
  couponsResolver,
  couponsExternalResolver,
  couponsDataResolver,
  couponsPatchResolver,
  couponsQueryResolver
} from './coupons.schema'

import type { Application } from '../../declarations'
import { ApplyCouponService, ConsumerCouponsService, CouponsService } from './coupons.class'
import { couponsPath, applyCouponPath, ConsumerCouponPath } from './coupons.shared'
import Coupons from './routeConfig/coupons'
import ApplyCoupon from './routeConfig/applyCoupon'
import ConsumerCoupon from './routeConfig/consumer'

export * from './coupons.class'
export * from './coupons.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const coupons = (app: Application) => {
  //  coupons path
  Coupons(app)
  // apply coupons
  ApplyCoupon(app)
  //
  ConsumerCoupon(app)
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [couponsPath]: CouponsService
    [applyCouponPath]: ApplyCouponService
    [ConsumerCouponPath]: ConsumerCouponsService
  }
}
