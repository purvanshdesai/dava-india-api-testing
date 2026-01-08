import { Application } from '../../../declarations'
import { CouponsService, getOptions } from '../coupons.class'
import {
  couponsPatchValidator,
  couponsQueryValidator,
  couponsResolver,
  couponsExternalResolver,
  couponsPatchResolver,
  couponsQueryResolver,
  couponsDataResolver,
  couponsDataValidator
} from '../coupons.schema'
import { hooks as schemaHooks } from '@feathersjs/schema'
import { authenticate } from '@feathersjs/authentication'
import { couponsPath } from '../coupons.shared'

export default function Coupons(app: Application) {
  // Register our service on the Feathers application
  app.use(couponsPath, new CouponsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['create', 'get', 'find', 'remove', 'patch'],
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(couponsPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
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
      create: [schemaHooks.validateData(couponsDataValidator), schemaHooks.resolveData(couponsDataResolver)],
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
