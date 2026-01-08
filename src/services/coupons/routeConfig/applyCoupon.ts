import { Application } from '../../../declarations'
import { ApplyCouponService, getOptions } from '../coupons.class'
import {
  couponsPatchValidator,
  couponsQueryValidator,
  couponsResolver,
  couponsExternalResolver,
  couponsPatchResolver,
  couponsQueryResolver
} from '../coupons.schema'
import { hooks as schemaHooks } from '@feathersjs/schema'
import { authenticate } from '@feathersjs/authentication'
import { applyCouponPath } from '../coupons.shared'

export default function ApplyCoupon(app: Application) {
  // Register our service on the Feathers application
  app.use(applyCouponPath, new ApplyCouponService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['get', 'find', 'create'],
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(applyCouponPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(couponsExternalResolver),
        schemaHooks.resolveResult(couponsResolver)
      ]
    },
    before: {
      all: [schemaHooks.validateQuery(couponsQueryValidator), schemaHooks.resolveQuery(couponsQueryResolver)],
      find: [],
      get: [],
      create: [],
      patch: [schemaHooks.validateData(couponsPatchValidator), schemaHooks.resolveData(couponsPatchResolver)],
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
