// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  consultancyAppointmentSlotsDataValidator,
  consultancyAppointmentSlotsPatchValidator,
  consultancyAppointmentSlotsQueryValidator,
  consultancyAppointmentSlotsResolver,
  consultancyAppointmentSlotsExternalResolver,
  consultancyAppointmentSlotsDataResolver,
  consultancyAppointmentSlotsPatchResolver,
  consultancyAppointmentSlotsQueryResolver
} from './consultancy-appointment-slots.schema'

import type { Application } from '../../declarations'
import { ConsultancyAppointmentSlotsService, getOptions } from './consultancy-appointment-slots.class'
import {
  consultancyAppointmentSlotsPath,
  consultancyAppointmentSlotsMethods
} from './consultancy-appointment-slots.shared'

export * from './consultancy-appointment-slots.class'
export * from './consultancy-appointment-slots.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const consultancyAppointmentSlots = (app: Application) => {
  // Register our service on the Feathers application
  app.use(consultancyAppointmentSlotsPath, new ConsultancyAppointmentSlotsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: consultancyAppointmentSlotsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(consultancyAppointmentSlotsPath).hooks({
    around: {
      all: [
        // authenticate('jwt'),
        schemaHooks.resolveExternal(consultancyAppointmentSlotsExternalResolver),
        schemaHooks.resolveResult(consultancyAppointmentSlotsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(consultancyAppointmentSlotsQueryValidator),
        schemaHooks.resolveQuery(consultancyAppointmentSlotsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(consultancyAppointmentSlotsDataValidator),
        schemaHooks.resolveData(consultancyAppointmentSlotsDataResolver)
      ],
      patch: [
        schemaHooks.validateData(consultancyAppointmentSlotsPatchValidator),
        schemaHooks.resolveData(consultancyAppointmentSlotsPatchResolver)
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
    [consultancyAppointmentSlotsPath]: ConsultancyAppointmentSlotsService
  }
}
