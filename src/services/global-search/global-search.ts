// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import type { Application } from '../../declarations'
import { GlobalSearchService, GlobalSearchSuggestionService } from './global-search.class'
import { globalSearchPath, globalSearchSuggestionPath, globalSearchMethods } from './global-search.shared'

export * from './global-search.class'

// A configure function that registers the service and its hooks via `app.configure`
export const globalSearch = (app: Application) => {
  // Register our service on the Feathers application
  app.use(globalSearchPath, new GlobalSearchService(), {
    // A list of all methods this service exposes externally
    methods: globalSearchMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })

  app.use(globalSearchSuggestionPath, new GlobalSearchSuggestionService(), {
    // A list of all methods this service exposes externally
    methods: ['find'],
    // You can add additional custom events to be sent to clients here
    events: []
  })

  // Initialize hooks
  app.service(globalSearchPath).hooks({})
  app.service(globalSearchSuggestionPath).hooks({})
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [globalSearchPath]: GlobalSearchService
    [globalSearchSuggestionPath]: GlobalSearchSuggestionService
  }
}
