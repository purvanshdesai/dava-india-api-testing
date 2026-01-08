// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  orderConsultationExternalResolver,
  orderConsultationResolver,
  orderDataResolver,
  orderDataValidator,
  orderExternalResolver,
  orderPatchResolver,
  orderPatchValidator,
  orderQueryResolver,
  orderQueryValidator,
  orderResolver
} from './order.schema'

import type { Application } from '../../declarations'
import {
  CancelOrderService,
  ConsumerOrderProductsService,
  OrderConsultationService,
  OrderService,
  ReturnOrderService,
  TrackOrderService
} from './order.class'
import {
  cancelOrderPath,
  consumerOrderProductsPath,
  orderConsultationMethods,
  orderConsultationPath,
  orderMethods,
  orderPath,
  returnOrderPath,
  setTimestamp,
  trackOrderPath
} from './order.shared'
import { returnOrderEndPoint } from './routeConfig/returnOrder'
import { cancelOrderEndPoint } from './routeConfig/cancelOrder'
import { trackOrderEndPoint } from './routeConfig/trackOrder'

export * from './order.class'
export * from './order.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const order = (app: Application) => {
  // Register our service on the Feathers application
  app.use(orderPath, new OrderService(), {
    // A list of all methods this service exposes externally
    methods: orderMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(orderPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(orderExternalResolver),
        schemaHooks.resolveResult(orderResolver)
      ]
    },
    before: {
      all: [schemaHooks.validateQuery(orderQueryValidator), schemaHooks.resolveQuery(orderQueryResolver)],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(orderDataValidator),
        schemaHooks.resolveData(orderDataResolver),
        setTimestamp
      ],
      patch: [
        schemaHooks.validateData(orderPatchValidator),
        schemaHooks.resolveData(orderPatchResolver),
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

  app.use(orderConsultationPath, new OrderConsultationService(), {
    methods: orderConsultationMethods,

    events: []
  })

  app.service(orderConsultationPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(orderConsultationExternalResolver),
        schemaHooks.resolveResult(orderConsultationResolver)
      ]
    },
    before: {
      all: [],
      find: [],
      get: [],
      create: [],
      patch: [],
      remove: []
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })

  returnOrderEndPoint(app)
  cancelOrderEndPoint(app)
  trackOrderEndPoint(app)

  app.use(consumerOrderProductsPath, new ConsumerOrderProductsService(), {
    methods: ['find'],

    events: []
  })

  app.service(consumerOrderProductsPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'authentication',
          strategies: ['jwt']
        })
      ]
    },
    before: {
      all: [],
      find: []
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
    [orderPath]: OrderService
    [orderConsultationPath]: OrderConsultationService
    [returnOrderPath]: ReturnOrderService
    [cancelOrderPath]: CancelOrderService
    [consumerOrderProductsPath]: ConsumerOrderProductsService
    [trackOrderPath]: TrackOrderService
  }
}
