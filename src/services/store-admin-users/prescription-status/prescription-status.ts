// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  storeAdminUsersPrescriptionStatusDataValidator,
  storeAdminUsersPrescriptionStatusPatchValidator,
  storeAdminUsersPrescriptionStatusQueryValidator,
  storeAdminUsersPrescriptionStatusResolver,
  storeAdminUsersPrescriptionStatusExternalResolver,
  storeAdminUsersPrescriptionStatusDataResolver,
  storeAdminUsersPrescriptionStatusPatchResolver,
  storeAdminUsersPrescriptionStatusQueryResolver
} from './prescription-status.schema'

import type { Application } from '../../../declarations'
import { StoreAdminUsersPrescriptionStatusService, getOptions } from './prescription-status.class'
import {
  storeAdminUsersPrescriptionStatusPath,
  storeAdminUsersPrescriptionStatusMethods
} from './prescription-status.shared'
import { authenticateHook } from '../../../utils'

export * from './prescription-status.class'
export * from './prescription-status.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const storeAdminUsersPrescriptionStatus = (app: Application) => {
  // Register our service on the Feathers application
  app.use(
    storeAdminUsersPrescriptionStatusPath,
    new StoreAdminUsersPrescriptionStatusService(getOptions(app)),
    {
      // A list of all methods this service exposes externally
      methods: storeAdminUsersPrescriptionStatusMethods,
      // You can add additional custom events to be sent to clients here
      events: []
    }
  )
  // Initialize hooks
  app.service(storeAdminUsersPrescriptionStatusPath).hooks({
    around: {
      all: [
        authenticateHook,
        schemaHooks.resolveExternal(storeAdminUsersPrescriptionStatusExternalResolver),
        schemaHooks.resolveResult(storeAdminUsersPrescriptionStatusResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(storeAdminUsersPrescriptionStatusQueryValidator),
        schemaHooks.resolveQuery(storeAdminUsersPrescriptionStatusQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(storeAdminUsersPrescriptionStatusDataValidator),
        schemaHooks.resolveData(storeAdminUsersPrescriptionStatusDataResolver)
      ],
      patch: [
        schemaHooks.validateData(storeAdminUsersPrescriptionStatusPatchValidator),
        schemaHooks.resolveData(storeAdminUsersPrescriptionStatusPatchResolver)
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
declare module '../../../declarations' {
  interface ServiceTypes {
    [storeAdminUsersPrescriptionStatusPath]: StoreAdminUsersPrescriptionStatusService
  }
}
