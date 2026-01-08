import { Application } from '../../../declarations'
import { ticketsSuperAdminMethods, ticketsSuperAdminPath } from '../tickets.shared'
import { getOptions, TicketsSuperAdminService } from '../tickets.class'
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import {
  ticketsDataResolver,
  ticketsDataValidator,
  ticketsExternalResolver,
  ticketsPatchResolver,
  ticketsPatchValidator,
  ticketsQueryResolver,
  ticketsQueryValidator,
  ticketsResolver
} from '../tickets.schema'
import { HookContext } from '@feathersjs/feathers'

export default function TicketsSuperAdminEndPoint(app: Application) {
  // Register our service on the Feathers application
  app.use(ticketsSuperAdminPath, new TicketsSuperAdminService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ticketsSuperAdminMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(ticketsSuperAdminPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(ticketsExternalResolver),
        schemaHooks.resolveResult(ticketsResolver)
      ]
    },
    before: {
      all: [schemaHooks.validateQuery(ticketsQueryValidator), schemaHooks.resolveQuery(ticketsQueryResolver)],
      find: [checkAuthorization],
      get: [checkAuthorization],
      create: [schemaHooks.validateData(ticketsDataValidator), schemaHooks.resolveData(ticketsDataResolver)],
      patch: [
        schemaHooks.validateData(ticketsPatchValidator),
        schemaHooks.resolveData(ticketsPatchResolver),
        checkAuthorization
      ]
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}

const checkAuthorization = (ctx: HookContext) => {
  return ctx
}
