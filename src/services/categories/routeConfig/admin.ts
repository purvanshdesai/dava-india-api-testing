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
import { CategoriesService, getOptions } from '../categories.class'
import { categoriesPath } from '../categories.shared'
import { authenticate } from '@feathersjs/authentication'

export default function Categories(app: Application) {
  // Register our service on the Feathers application
  app.use(categoriesPath, new CategoriesService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['create', 'get', 'find', 'remove', 'patch'],
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(categoriesPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
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
