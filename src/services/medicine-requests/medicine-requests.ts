// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  medicineRequestsDataValidator,
  medicineRequestsPatchValidator,
  medicineRequestsQueryValidator,
  medicineRequestsResolver,
  medicineRequestsExternalResolver,
  medicineRequestsDataResolver,
  medicineRequestsPatchResolver,
  medicineRequestsQueryResolver
} from './medicine-requests.schema'

import type { Application } from '../../declarations'
import { MedicineRequestsAdminService, MedicineRequestsService, getOptions } from './medicine-requests.class'
import { medicineRequestsPath, medicineRequestsMethods, medicineRequestsAdminPath } from './medicine-requests.shared'
import { authenticate } from '@feathersjs/authentication'

export * from './medicine-requests.class'
export * from './medicine-requests.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const medicineRequests = (app: Application) => {
  // Register our service on the Feathers application
  app.use(medicineRequestsPath, new MedicineRequestsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: medicineRequestsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(medicineRequestsPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(medicineRequestsExternalResolver),
        schemaHooks.resolveResult(medicineRequestsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(medicineRequestsQueryValidator),
        schemaHooks.resolveQuery(medicineRequestsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(medicineRequestsDataValidator),
        schemaHooks.resolveData(medicineRequestsDataResolver)
      ],
      patch: [
        schemaHooks.validateData(medicineRequestsPatchValidator),
        schemaHooks.resolveData(medicineRequestsPatchResolver)
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

  // admin  hooks 
  app.use(medicineRequestsAdminPath, new MedicineRequestsAdminService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: medicineRequestsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(medicineRequestsAdminPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(medicineRequestsExternalResolver),
        schemaHooks.resolveResult(medicineRequestsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(medicineRequestsQueryValidator),
        schemaHooks.resolveQuery(medicineRequestsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(medicineRequestsDataValidator),
        schemaHooks.resolveData(medicineRequestsDataResolver)
      ],
      patch: [
        schemaHooks.validateData(medicineRequestsPatchValidator),
        schemaHooks.resolveData(medicineRequestsPatchResolver)
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

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [medicineRequestsPath]: MedicineRequestsService
    [medicineRequestsAdminPath]: MedicineRequestsAdminService
  }
}
