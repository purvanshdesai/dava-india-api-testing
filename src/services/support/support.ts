// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  supportDataValidator,
  supportPatchValidator,
  supportQueryValidator,
  supportResolver,
  supportExternalResolver,
  supportDataResolver,
  supportPatchResolver,
  supportQueryResolver
} from './support.schema'

import type { Application } from '../../declarations'
import { SupportService, getOptions } from './support.class'
import { supportPath, supportMethods } from './support.shared'

export * from './support.class'
export * from './support.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const support = (app: Application) => {
  // Register our service on the Feathers application
  app.use(supportPath, new SupportService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: supportMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(supportPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(supportExternalResolver),
        schemaHooks.resolveResult(supportResolver)
      ]
    },
    before: {
      all: [schemaHooks.validateQuery(supportQueryValidator), schemaHooks.resolveQuery(supportQueryResolver)],
      find: [],
      create: [schemaHooks.validateData(supportDataValidator), schemaHooks.resolveData(supportDataResolver)]
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
    [supportPath]: SupportService
  }
}
