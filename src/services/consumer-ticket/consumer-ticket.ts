// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  consumerTicketDataValidator,
  consumerTicketPatchValidator,
  consumerTicketQueryValidator,
  consumerTicketResolver,
  consumerTicketExternalResolver,
  consumerTicketDataResolver,
  consumerTicketPatchResolver,
  consumerTicketQueryResolver
} from './consumer-ticket.schema'

import type { Application } from '../../declarations'
import { ConsumerTicketService, getOptions } from './consumer-ticket.class'
import { consumerTicketPath, consumerTicketMethods } from './consumer-ticket.shared'

export * from './consumer-ticket.class'
export * from './consumer-ticket.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const consumerTicket = (app: Application) => {
  // Register our service on the Feathers application
  app.use(consumerTicketPath, new ConsumerTicketService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: consumerTicketMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(consumerTicketPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(consumerTicketExternalResolver),
        schemaHooks.resolveResult(consumerTicketResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(consumerTicketQueryValidator),
        schemaHooks.resolveQuery(consumerTicketQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(consumerTicketDataValidator),
        schemaHooks.resolveData(consumerTicketDataResolver)
      ],
      patch: [
        schemaHooks.validateData(consumerTicketPatchValidator),
        schemaHooks.resolveData(consumerTicketPatchResolver)
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
    [consumerTicketPath]: ConsumerTicketService
  }
}
