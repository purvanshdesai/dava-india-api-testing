// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  patientsDataValidator,
  patientsPatchValidator,
  patientsQueryValidator,
  patientsResolver,
  patientsExternalResolver,
  patientsDataResolver,
  patientsPatchResolver,
  patientsQueryResolver
} from './patients.schema'

import type { Application } from '../../declarations'
import { PatientsService, getOptions } from './patients.class'
import { patientsPath, patientsMethods } from './patients.shared'

export * from './patients.class'
export * from './patients.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const patients = (app: Application) => {
  // Register our service on the Feathers application
  app.use(patientsPath, new PatientsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: patientsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(patientsPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(patientsExternalResolver),
        schemaHooks.resolveResult(patientsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(patientsQueryValidator),
        schemaHooks.resolveQuery(patientsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(patientsDataValidator),
        schemaHooks.resolveData(patientsDataResolver)
      ],
      patch: [
        schemaHooks.validateData(patientsPatchValidator),
        schemaHooks.resolveData(patientsPatchResolver)
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
    [patientsPath]: PatientsService
  }
}
