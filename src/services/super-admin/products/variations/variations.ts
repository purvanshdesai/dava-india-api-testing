// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'
import mongoose from 'mongoose'
import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  variationsDataValidator,
  variationsPatchValidator,
  variationsQueryValidator,
  variationsResolver,
  variationsExternalResolver,
  variationsDataResolver,
  variationsPatchResolver,
  variationsQueryResolver
} from './variations.schema'

import type { Application } from '../../../../declarations'
import { VariationsService, getOptions } from './variations.class'
import { variationsPath, variationsMethods } from './variations.shared'
import { BadRequest } from '@feathersjs/errors'

export * from './variations.class'
export * from './variations.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const variations = (app: Application) => {
  // Register our service on the Feathers application
  app.use(variationsPath, new VariationsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: variationsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(variationsPath).hooks({
    around: {
      all: [
        // authenticate('jwt'),
        schemaHooks.resolveExternal(variationsExternalResolver),
        schemaHooks.resolveResult(variationsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(variationsQueryValidator),
        schemaHooks.resolveQuery(variationsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(variationsDataValidator),
        schemaHooks.resolveData(variationsDataResolver),
        // (context) => {
        //   const { data } = context
        //   if (!data) return context
        //   if (Array.isArray(data)) {
        //     data.forEach((item) => {
        //       item.productId = new mongoose.Types.ObjectId(item.productId as string)
        //       item.createdAt = new Date().toISOString()
        //       item.updatedAt = new Date().toISOString()
        //     })
        //   } else {
        //     data.productId = new mongoose.Types.ObjectId(data.productId as string)
        //     data.createdAt = new Date().toISOString()
        //     data.updatedAt = new Date().toISOString()
        //   }
        //   return context
        // }
      ],
      patch: [
        schemaHooks.validateData(variationsPatchValidator),
        schemaHooks.resolveData(variationsPatchResolver),
        // (context) => {
        //   let { data, params } = context as any
        //   if (!data || !params.route.productId) return context
        //   const productId = params.route.productId

        //   data.productId = new mongoose.Types.ObjectId(productId as string)
        //   data.updatedAt = new Date().toISOString()
        //   return context
        // }
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
declare module '../../../../declarations' {
  interface ServiceTypes {
    [variationsPath]: VariationsService
  }
}
