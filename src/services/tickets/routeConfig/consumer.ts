import { Application } from '../../../declarations'
import { ticketsMethods, ticketsPath } from '../tickets.shared'
import { getOptions, TicketsService } from '../tickets.class'
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import {
  ticketsConsumerDataResolver,
  ticketsConsumerDataValidator,
  ticketsExternalResolver,
  ticketsPatchResolver,
  ticketsPatchValidator,
  ticketsQueryResolver,
  ticketsQueryValidator,
  ticketsResolver
} from '../tickets.schema'

export default function TicketsConsumerEndPoint(app: Application) {
  // Register our service on the Feathers application
  app.use(ticketsPath, new TicketsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ticketsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(ticketsPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(ticketsExternalResolver),
        schemaHooks.resolveResult(ticketsResolver)
      ]
    },
    before: {
      all: [schemaHooks.validateQuery(ticketsQueryValidator), schemaHooks.resolveQuery(ticketsQueryResolver)],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(ticketsConsumerDataValidator),
        schemaHooks.resolveData(ticketsConsumerDataResolver)
      ],
      patch: [schemaHooks.validateData(ticketsPatchValidator), schemaHooks.resolveData(ticketsPatchResolver)]
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}
