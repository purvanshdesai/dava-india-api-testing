// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  couponUsagesDataValidator,
  couponUsagesPatchValidator,
  couponUsagesQueryValidator,
  couponUsagesResolver,
  couponUsagesExternalResolver,
  couponUsagesDataResolver,
  couponUsagesPatchResolver,
  couponUsagesQueryResolver
} from './coupon-usages.schema'

import type { Application } from '../../declarations'
import { CouponUsagesService, getOptions } from './coupon-usages.class'
import { couponUsagesPath, couponUsagesMethods } from './coupon-usages.shared'

export * from './coupon-usages.class'
export * from './coupon-usages.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const couponUsages = (app: Application) => {
  // Register our service on the Feathers application
  app.use(couponUsagesPath, new CouponUsagesService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: couponUsagesMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(couponUsagesPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(couponUsagesExternalResolver),
        schemaHooks.resolveResult(couponUsagesResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(couponUsagesQueryValidator),
        schemaHooks.resolveQuery(couponUsagesQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(couponUsagesDataValidator),
        schemaHooks.resolveData(couponUsagesDataResolver)
      ],
      patch: [
        schemaHooks.validateData(couponUsagesPatchValidator),
        schemaHooks.resolveData(couponUsagesPatchResolver)
      ],
      remove: []
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [couponUsagesPath]: CouponUsagesService
  }
}
