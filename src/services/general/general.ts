// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  generalDataValidator,
  generalPatchValidator,
  generalQueryValidator,
  generalResolver,
  generalExternalResolver,
  generalDataResolver,
  generalPatchResolver,
  generalQueryResolver
} from './general.schema'

import type { Application } from '../../declarations'
import { GeneralService, getOptions, VersionUpdateService } from './general.class'
import { generalPath, generalMethods, versionUpdatePath } from './general.shared'

export * from './general.class'
export * from './general.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const general = (app: Application) => {
  // Register our service on the Feathers application
  app.use(generalPath, new GeneralService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: generalMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(generalPath).hooks({
    around: {
      all: [schemaHooks.resolveExternal(generalExternalResolver), schemaHooks.resolveResult(generalResolver)]
    },
    before: {
      all: [schemaHooks.validateQuery(generalQueryValidator), schemaHooks.resolveQuery(generalQueryResolver)],
      find: [
        async (context) => {
          const { headers } = context.arguments[0]
          const userAgent = headers['user-agent'].toLowerCase()
          const res = context.params.res // Access the Express response object

          if (!res) {
            throw new Error('Response object is not available in context.params')
          }

          if (/android/i.test(userAgent)) {
            res.redirect('https://play.google.com/store/apps/details?id=com.davaindia')
          } else if (/ipad|iphone/i.test(userAgent)) {
            res.redirect('https://apps.apple.com/in/app/davaindia-generic-pharmacy/id6741474883')
          } else {
            res.redirect('https://www.davaindia.com/')
          }

          // Prevent further processing since the response is already handled
          context.result = null
          return context
        }
      ],
      create: [schemaHooks.validateData(generalDataValidator), schemaHooks.resolveData(generalDataResolver)]
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
  app.use(versionUpdatePath, new VersionUpdateService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: generalMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(versionUpdatePath).hooks({
    around: {
      all: [schemaHooks.resolveExternal(generalExternalResolver), schemaHooks.resolveResult(generalResolver)]
    },
    before: {
      all: [schemaHooks.validateQuery(generalQueryValidator), schemaHooks.resolveQuery(generalQueryResolver)],
      find: [],
      create: [schemaHooks.validateData(generalDataValidator), schemaHooks.resolveData(generalDataResolver)]
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
    [generalPath]: GeneralService
    [versionUpdatePath]: VersionUpdateService
  }
}
