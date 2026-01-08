// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  chatgptTranslationDataValidator,
  chatgptTranslationPatchValidator,
  chatgptTranslationQueryValidator,
  chatgptTranslationResolver,
  chatgptTranslationExternalResolver,
  chatgptTranslationDataResolver,
  chatgptTranslationPatchResolver,
  chatgptTranslationQueryResolver
} from './chatgpt-translation.schema'

import type { Application } from '../../declarations'
import { ChatgptTranslationService, getOptions } from './chatgpt-translation.class'
import { chatgptTranslationPath, chatgptTranslationMethods } from './chatgpt-translation.shared'

export * from './chatgpt-translation.class'
export * from './chatgpt-translation.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const chatgptTranslation = (app: Application) => {
  // Register our service on the Feathers application
  app.use(chatgptTranslationPath, new ChatgptTranslationService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: chatgptTranslationMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(chatgptTranslationPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(chatgptTranslationExternalResolver),
        schemaHooks.resolveResult(chatgptTranslationResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(chatgptTranslationQueryValidator),
        schemaHooks.resolveQuery(chatgptTranslationQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(chatgptTranslationDataValidator),
        schemaHooks.resolveData(chatgptTranslationDataResolver)
      ],
      patch: [
        schemaHooks.validateData(chatgptTranslationPatchValidator),
        schemaHooks.resolveData(chatgptTranslationPatchResolver)
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
    [chatgptTranslationPath]: ChatgptTranslationService
  }
}
