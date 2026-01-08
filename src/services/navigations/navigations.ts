// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  navigationsDataValidator,
  navigationsPatchValidator,
  navigationsQueryValidator,
  navigationPositioningDataValidator,
  navigationsResolver,
  navigationsExternalResolver,
  navigationsDataResolver,
  navigationsPatchResolver,
  navigationsQueryResolver,
  navigationsPositioningDataResolver
} from './navigations.schema'

import type { Application } from '../../declarations'
import {
  NavigationsService,
  ConsumerNavigationsService,
  ConsumerCollectionNavigationsService,
  getOptions,
  ConsumerCollectionNavigationsServiceForMobile,
  NavigationLayoutPositioningService
} from './navigations.class'
import {
  navigationsPath,
  consumerNavigationsPath,
  consumerCollectionNavigationPath,
  navigationLayoutPositioningPath,
  navigationsMethods,
  consumerCollectionNavigationPathMobile
} from './navigations.shared'

export * from './navigations.class'
export * from './navigations.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const navigations = (app: Application) => {
  // Register our service on the Feathers application
  app.use(navigationsPath, new NavigationsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: navigationsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })

  app.use(consumerNavigationsPath, new ConsumerNavigationsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['find'],
    // You can add additional custom events to be sent to clients here
    events: []
  })

  app.use(consumerCollectionNavigationPath, new ConsumerCollectionNavigationsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['find'],
    // You can add additional custom events to be sent to clients here
    events: []
  })

  app.use(
    consumerCollectionNavigationPathMobile,
    new ConsumerCollectionNavigationsServiceForMobile(getOptions(app)),
    {
      // A list of all methods this service exposes externally
      methods: ['find'],
      // You can add additional custom events to be sent to clients here
      events: []
    }
  )

  app.use(navigationLayoutPositioningPath, new NavigationLayoutPositioningService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['create'],
    // You can add additional custom events to be sent to clients here
    events: []
  })

  // Initialize hooks
  app.service(navigationsPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(navigationsExternalResolver),
        schemaHooks.resolveResult(navigationsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(navigationsQueryValidator),
        schemaHooks.resolveQuery(navigationsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(navigationsDataValidator),
        schemaHooks.resolveData(navigationsDataResolver)
      ],
      patch: [
        schemaHooks.validateData(navigationsPatchValidator),
        schemaHooks.resolveData(navigationsPatchResolver)
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

  app.service(navigationLayoutPositioningPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        })
      ]
    },
    before: {
      all: [],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(navigationPositioningDataValidator),
        schemaHooks.resolveData(navigationsPositioningDataResolver)
      ],
      patch: [],
      remove: []
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })

  app.service(consumerNavigationsPath).hooks({})
  app.service(consumerCollectionNavigationPath).hooks({})
  app.service(consumerCollectionNavigationPathMobile).hooks({})
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [navigationsPath]: NavigationsService
    [consumerNavigationsPath]: ConsumerNavigationsService
    [consumerCollectionNavigationPath]: ConsumerCollectionNavigationsService
    [consumerCollectionNavigationPathMobile]: ConsumerCollectionNavigationsServiceForMobile
    [navigationLayoutPositioningPath]: NavigationLayoutPositioningService
  }
}
