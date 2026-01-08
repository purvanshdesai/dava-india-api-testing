// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  userAddressesDataValidator,
  userAddressesPatchValidator,
  userAddressesQueryValidator,
  userAddressesResolver,
  userAddressesExternalResolver,
  userAddressesDataResolver,
  userAddressesPatchResolver,
  userAddressesQueryResolver
} from './user-addresses.schema'

import type { Application } from '../../declarations'
import { UserAddressesService, getOptions } from './user-addresses.class'
import { userAddressesPath, userAddressesMethods, setTimestamp } from './user-addresses.shared'

export * from './user-addresses.class'
export * from './user-addresses.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const userAddresses = (app: Application) => {
  // Register our service on the Feathers application
  app.use(userAddressesPath, new UserAddressesService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: userAddressesMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(userAddressesPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(userAddressesExternalResolver),
        schemaHooks.resolveResult(userAddressesResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(userAddressesQueryValidator),
        schemaHooks.resolveQuery(userAddressesQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(userAddressesDataValidator),
        schemaHooks.resolveData(userAddressesDataResolver),
        setTimestamp
      ],
      patch: [
        schemaHooks.validateData(userAddressesPatchValidator),
        schemaHooks.resolveData(userAddressesPatchResolver),
        setTimestamp
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
    [userAddressesPath]: UserAddressesService
  }
}
