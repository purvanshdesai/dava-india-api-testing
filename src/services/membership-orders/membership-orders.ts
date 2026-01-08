// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  membershipOrdersDataValidator,
  membershipOrdersPatchValidator,
  membershipOrdersQueryValidator,
  membershipOrdersResolver,
  membershipOrdersExternalResolver,
  membershipOrdersDataResolver,
  membershipOrdersPatchResolver,
  membershipOrdersQueryResolver
} from './membership-orders.schema'

import type { Application } from '../../declarations'
import { MembershipOrdersService, getOptions } from './membership-orders.class'
import { membershipOrdersPath, membershipOrdersMethods, setTimestamp } from './membership-orders.shared'

export * from './membership-orders.class'
export * from './membership-orders.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const membershipOrders = (app: Application) => {
  // Register our service on the Feathers application
  app.use(membershipOrdersPath, new MembershipOrdersService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: membershipOrdersMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(membershipOrdersPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(membershipOrdersExternalResolver),
        schemaHooks.resolveResult(membershipOrdersResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(membershipOrdersQueryValidator),
        schemaHooks.resolveQuery(membershipOrdersQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        setTimestamp,
        schemaHooks.validateData(membershipOrdersDataValidator),
        schemaHooks.resolveData(membershipOrdersDataResolver)
      ],
      patch: [
        setTimestamp,
        schemaHooks.validateData(membershipOrdersPatchValidator),
        schemaHooks.resolveData(membershipOrdersPatchResolver)
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
    [membershipOrdersPath]: MembershipOrdersService
  }
}
