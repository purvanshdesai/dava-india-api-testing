// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  exportsDataValidator,
  exportsPatchValidator,
  exportsQueryValidator,
  exportsResolver,
  exportsExternalResolver,
  exportsDataResolver,
  exportsPatchResolver,
  exportsQueryResolver
} from './exports.schema'

import type { Application } from '../../declarations'
import { ExportsService, getOptions } from './exports.class'
import { exportsPath, exportsMethods } from './exports.shared'

export * from './exports.class'
export * from './exports.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const exportData = (app: Application) => {
  // Register our service on the Feathers application
  app.use(exportsPath, new ExportsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: exportsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(exportsPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(exportsExternalResolver),
        schemaHooks.resolveResult(exportsResolver)
      ]
    },
    before: {
      all: [schemaHooks.validateQuery(exportsQueryValidator), schemaHooks.resolveQuery(exportsQueryResolver)],
      create: [schemaHooks.validateData(exportsDataValidator), schemaHooks.resolveData(exportsDataResolver)]
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
    [exportsPath]: ExportsService
  }
}
