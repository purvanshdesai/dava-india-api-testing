import { Application } from '../../../declarations'
import { courierPartnersMethods, courierPartnersPath } from '../logistics.shared'
import { CourierPartnersService, getOptions } from '../logistics.class'
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import {
  logisticsDataResolver,
  logisticsDataValidator,
  logisticsExternalResolver,
  logisticsPatchResolver,
  logisticsPatchValidator,
  logisticsQueryResolver,
  logisticsQueryValidator,
  logisticsResolver
} from '../logistics.schema'

export default function CourierPartnersEndPoint(app: Application) {
  // Register our service on the Feathers application
  app.use(courierPartnersPath, new CourierPartnersService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: courierPartnersMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(courierPartnersPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(logisticsExternalResolver),
        schemaHooks.resolveResult(logisticsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(logisticsQueryValidator),
        schemaHooks.resolveQuery(logisticsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(logisticsDataValidator),
        schemaHooks.resolveData(logisticsDataResolver)
      ],
      patch: [
        schemaHooks.validateData(logisticsPatchValidator),
        schemaHooks.resolveData(logisticsPatchResolver)
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
