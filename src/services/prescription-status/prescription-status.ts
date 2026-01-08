// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  prescriptionStatusDataValidator,
  prescriptionStatusPatchValidator,
  prescriptionStatusQueryValidator,
  prescriptionStatusResolver,
  prescriptionStatusExternalResolver,
  prescriptionStatusDataResolver,
  prescriptionStatusPatchResolver,
  prescriptionStatusQueryResolver
} from './prescription-status.schema'

import type { Application } from '../../declarations'
import { PrescriptionStatusService, getOptions } from './prescription-status.class'
import { prescriptionStatusPath, prescriptionStatusMethods } from './prescription-status.shared'

export * from './prescription-status.class'
export * from './prescription-status.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const prescriptionStatus = (app: Application) => {
  // Register our service on the Feathers application
  app.use(prescriptionStatusPath, new PrescriptionStatusService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: prescriptionStatusMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(prescriptionStatusPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(prescriptionStatusExternalResolver),
        schemaHooks.resolveResult(prescriptionStatusResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(prescriptionStatusQueryValidator),
        schemaHooks.resolveQuery(prescriptionStatusQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(prescriptionStatusDataValidator),
        schemaHooks.resolveData(prescriptionStatusDataResolver)
      ],
      patch: [
        schemaHooks.validateData(prescriptionStatusPatchValidator),
        schemaHooks.resolveData(prescriptionStatusPatchResolver)
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
    [prescriptionStatusPath]: PrescriptionStatusService
  }
}
