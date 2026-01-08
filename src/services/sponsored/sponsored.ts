// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  sponsoredDataValidator,
  sponsoredPatchValidator,
  sponsoredQueryValidator,
  sponsoredResolver,
  sponsoredExternalResolver,
  sponsoredDataResolver,
  sponsoredPatchResolver,
  sponsoredQueryResolver
} from './sponsored.schema'

import {
  sponsoredBannerDataValidator,
  sponsoredBannerPatchValidator,
  sponsoredBannerQueryValidator,
  sponsoredBannerResolver,
  sponsoredBannerExternalResolver,
  sponsoredBannerDataResolver,
  sponsoredBannerPatchResolver,
  sponsoredBannerQueryResolver
} from './sponsored-banners.schema'

import type { Application } from '../../declarations'
import {
  SponsoredService,
  SponsoredBannerService,
  SponsoredLayoutPositioningService,
  SponsoredConsumerService,
  getOptions
} from './sponsored.class'
import {
  sponsoredPath,
  sponsoredBannerPath,
  sponsoredLayoutPositioningPath,
  sponsoredConsumerPath,
  sponsoredMethods,
  setTimestamp,
  assignPosition
} from './sponsored.shared'

export * from './sponsored.class'
export * from './sponsored.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const sponsored = (app: Application) => {
  // Register our service on the Feathers application
  app.use(sponsoredPath, new SponsoredService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: sponsoredMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })

  // Register our service on the Feathers application
  app.use(sponsoredBannerPath, new SponsoredBannerService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: sponsoredMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })

  // Register our service on the Feathers application
  app.use(sponsoredLayoutPositioningPath, new SponsoredLayoutPositioningService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['create'],
    // You can add additional custom events to be sent to clients here
    events: []
  })

  // Register our service on the Feathers application
  app.use(sponsoredConsumerPath, new SponsoredConsumerService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['find'],
    // You can add additional custom events to be sent to clients here
    events: []
  })

  // Initialize hooks
  app.service(sponsoredPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(sponsoredExternalResolver),
        schemaHooks.resolveResult(sponsoredResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(sponsoredQueryValidator),
        schemaHooks.resolveQuery(sponsoredQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        setTimestamp,
        assignPosition,
        schemaHooks.validateData(sponsoredDataValidator),
        schemaHooks.resolveData(sponsoredDataResolver)
      ],
      patch: [
        setTimestamp,
        schemaHooks.validateData(sponsoredPatchValidator),
        schemaHooks.resolveData(sponsoredPatchResolver)
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

  // Initialize hooks
  app.service(sponsoredBannerPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(sponsoredBannerExternalResolver),
        schemaHooks.resolveResult(sponsoredBannerResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(sponsoredBannerQueryValidator),
        schemaHooks.resolveQuery(sponsoredBannerQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        setTimestamp,
        schemaHooks.validateData(sponsoredBannerDataValidator),
        schemaHooks.resolveData(sponsoredBannerDataResolver)
      ],
      patch: [
        setTimestamp,
        schemaHooks.validateData(sponsoredBannerPatchValidator),
        schemaHooks.resolveData(sponsoredBannerPatchResolver)
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

  app.service(sponsoredLayoutPositioningPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(sponsoredBannerExternalResolver),
        schemaHooks.resolveResult(sponsoredBannerResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(sponsoredBannerQueryValidator),
        schemaHooks.resolveQuery(sponsoredBannerQueryResolver)
      ],
      find: [],
      get: [],
      create: [],
      patch: [
        schemaHooks.validateData(sponsoredBannerPatchValidator),
        schemaHooks.resolveData(sponsoredBannerPatchResolver)
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

  app.service(sponsoredConsumerPath).hooks({})
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [sponsoredPath]: SponsoredService
    [sponsoredBannerPath]: SponsoredBannerService
    [sponsoredLayoutPositioningPath]: SponsoredLayoutPositioningService
    [sponsoredConsumerPath]: SponsoredConsumerService
  }
}
