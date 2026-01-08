import { Application } from '../../../declarations'
import { logisticsRuleCouriersMethods, logisticsRuleCouriersPath } from '../logistics.shared'
import { getOptions, LogisticsRuleCouriersService } from '../logistics.class'
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

export default function LogisticsRuleCouriersEndPoint(app: Application) {
  // Register our service on the Feathers application
  app.use(logisticsRuleCouriersPath, new LogisticsRuleCouriersService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: logisticsRuleCouriersMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(logisticsRuleCouriersPath).hooks({
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
