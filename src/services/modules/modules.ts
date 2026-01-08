// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  modulesDataValidator,
  modulesPatchValidator,
  modulesQueryValidator,
  modulesResolver,
  modulesExternalResolver,
  modulesDataResolver,
  modulesPatchResolver,
  modulesQueryResolver
} from './modules.schema'

import type { Application } from '../../declarations'
import { ModulesService, getOptions } from './modules.class'
import { modulesPath, modulesMethods } from './modules.shared'

export * from './modules.class'
export * from './modules.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const modules = (app: Application) => {
  // Register our service on the Feathers application
  app.use(modulesPath, new ModulesService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: modulesMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(modulesPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(modulesExternalResolver),
        schemaHooks.resolveResult(modulesResolver)
      ]
    },
    before: {
      all: [schemaHooks.validateQuery(modulesQueryValidator), schemaHooks.resolveQuery(modulesQueryResolver)],
      find: [],
      get: [],
      create: [schemaHooks.validateData(modulesDataValidator), schemaHooks.resolveData(modulesDataResolver)],
      patch: [schemaHooks.validateData(modulesPatchValidator), schemaHooks.resolveData(modulesPatchResolver)],
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

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [modulesPath]: ModulesService
  }
}
