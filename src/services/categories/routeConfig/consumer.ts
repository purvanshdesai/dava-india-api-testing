import { Application } from '../../../declarations'
import {
  categoriesPatchValidator,
  categoriesQueryValidator,
  categoriesResolver,
  categoriesExternalResolver,
  categoriesPatchResolver,
  categoriesQueryResolver
} from '../categories.schema'
import { hooks as schemaHooks } from '@feathersjs/schema'
import { ConsumerCategoriesService, getOptions } from '../categories.class'
import { consumerCategoriesPath } from '../categories.shared'

export default function ConsumerCategories(app: Application) {
  // Register our service on the Feathers application
  app.use(consumerCategoriesPath, new ConsumerCategoriesService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['get', 'find'],
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(consumerCategoriesPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(categoriesExternalResolver),
        schemaHooks.resolveResult(categoriesResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(categoriesQueryValidator),
        schemaHooks.resolveQuery(categoriesQueryResolver)
      ],
      find: [],
      get: [],
      create: [],
      patch: [
        schemaHooks.validateData(categoriesPatchValidator),
        schemaHooks.resolveData(categoriesPatchResolver)
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
