// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  medicineRemainderDataValidator,
  medicineRemainderPatchValidator,
  medicineRemainderQueryValidator,
  medicineRemainderResolver,
  medicineRemainderExternalResolver,
  medicineRemainderDataResolver,
  medicineRemainderPatchResolver,
  medicineRemainderQueryResolver
} from './medicine-remainder.schema'

import type { Application } from '../../declarations'
import { MedicineRemainderService, getOptions } from './medicine-remainder.class'
import { medicineRemainderPath, medicineRemainderMethods } from './medicine-remainder.shared'

export * from './medicine-remainder.class'
export * from './medicine-remainder.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const medicineRemainder = (app: Application) => {
  // Register our service on the Feathers application
  app.use(medicineRemainderPath, new MedicineRemainderService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: medicineRemainderMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(medicineRemainderPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(medicineRemainderExternalResolver),
        schemaHooks.resolveResult(medicineRemainderResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(medicineRemainderQueryValidator),
        schemaHooks.resolveQuery(medicineRemainderQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(medicineRemainderDataValidator),
        schemaHooks.resolveData(medicineRemainderDataResolver)
      ],
      patch: [
        schemaHooks.validateData(medicineRemainderPatchValidator),
        schemaHooks.resolveData(medicineRemainderPatchResolver)
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
    [medicineRemainderPath]: MedicineRemainderService
  }
}
