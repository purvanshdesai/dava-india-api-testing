// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  membershipsDataValidator,
  membershipsPatchValidator,
  membershipsQueryValidator,
  membershipsResolver,
  membershipsExternalResolver,
  membershipsDataResolver,
  membershipsPatchResolver,
  membershipsQueryResolver
} from './memberships.schema'

import type { Application } from '../../declarations'
import { MembershipsService, getOptions } from './memberships.class'
import { membershipsPath, membershipsMethods, setTimestamp } from './memberships.shared'

export * from './memberships.class'
export * from './memberships.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const memberships = (app: Application) => {
  // Register our service on the Feathers application
  app.use(membershipsPath, new MembershipsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: membershipsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(membershipsPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(membershipsExternalResolver),
        schemaHooks.resolveResult(membershipsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(membershipsQueryValidator),
        schemaHooks.resolveQuery(membershipsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        setTimestamp,
        schemaHooks.validateData(membershipsDataValidator),
        schemaHooks.resolveData(membershipsDataResolver)
      ],
      patch: [
        setTimestamp,
        schemaHooks.validateData(membershipsPatchValidator),
        schemaHooks.resolveData(membershipsPatchResolver)
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
    [membershipsPath]: MembershipsService
  }
}
