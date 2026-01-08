// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  contactDataValidator,
  contactPatchValidator,
  contactQueryValidator,
  contactResolver,
  contactExternalResolver,
  contactDataResolver,
  contactPatchResolver,
  contactQueryResolver
} from './contact.schema'

import type { Application } from '../../declarations'
import { ContactService, getOptions } from './contact.class'
import { contactPath, contactMethods } from './contact.shared'

export * from './contact.class'
export * from './contact.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const contact = (app: Application) => {
  // Register our service on the Feathers application
  app.use(contactPath, new ContactService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: contactMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(contactPath).hooks({
    around: {
      all: [schemaHooks.resolveExternal(contactExternalResolver), schemaHooks.resolveResult(contactResolver)]
    },
    before: {
      all: [schemaHooks.validateQuery(contactQueryValidator), schemaHooks.resolveQuery(contactQueryResolver)],
      find: [],
      get: [],
      create: [schemaHooks.validateData(contactDataValidator), schemaHooks.resolveData(contactDataResolver)],
      patch: [schemaHooks.validateData(contactPatchValidator), schemaHooks.resolveData(contactPatchResolver)],
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
    [contactPath]: ContactService
  }
}
