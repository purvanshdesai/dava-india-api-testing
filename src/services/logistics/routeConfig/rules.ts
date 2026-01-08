import { Application } from '../../../declarations'
import { logisticsMethods, logisticsPath } from '../logistics.shared'
import { getOptions, LogisticsService } from '../logistics.class'
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

export default function LogisticsRulesEndPoint(app: Application) {
  // Register our service on the Feathers application
  app.use(logisticsPath, new LogisticsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: logisticsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(logisticsPath).hooks({
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
