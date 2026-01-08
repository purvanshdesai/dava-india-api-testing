// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  chatgptProductInfoGenerationDataValidator,
  chatgptProductInfoGenerationPatchValidator,
  chatgptProductInfoGenerationQueryValidator,
  chatgptProductInfoGenerationResolver,
  chatgptProductInfoGenerationExternalResolver,
  chatgptProductInfoGenerationDataResolver,
  chatgptProductInfoGenerationPatchResolver,
  chatgptProductInfoGenerationQueryResolver
} from './chatgpt-product-info-generation.schema'

import type { Application } from '../../declarations'
import { ChatgptProductInfoGenerationService, getOptions } from './chatgpt-product-info-generation.class'
import {
  chatgptProductInfoGenerationPath,
  chatgptProductInfoGenerationMethods
} from './chatgpt-product-info-generation.shared'

export * from './chatgpt-product-info-generation.class'
export * from './chatgpt-product-info-generation.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const chatgptProductInfoGeneration = (app: Application) => {
  // Register our service on the Feathers application
  app.use(chatgptProductInfoGenerationPath, new ChatgptProductInfoGenerationService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: chatgptProductInfoGenerationMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(chatgptProductInfoGenerationPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(chatgptProductInfoGenerationExternalResolver),
        schemaHooks.resolveResult(chatgptProductInfoGenerationResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(chatgptProductInfoGenerationQueryValidator),
        schemaHooks.resolveQuery(chatgptProductInfoGenerationQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(chatgptProductInfoGenerationDataValidator),
        schemaHooks.resolveData(chatgptProductInfoGenerationDataResolver)
      ],
      patch: [
        schemaHooks.validateData(chatgptProductInfoGenerationPatchValidator),
        schemaHooks.resolveData(chatgptProductInfoGenerationPatchResolver)
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
    [chatgptProductInfoGenerationPath]: ChatgptProductInfoGenerationService
  }
}
