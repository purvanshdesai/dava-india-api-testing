// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  deliveryPoliciesDataValidator,
  deliveryPoliciesPatchValidator,
  deliveryPoliciesQueryValidator,
  deliveryPoliciesResolver,
  deliveryPoliciesExternalResolver,
  deliveryPoliciesDataResolver,
  deliveryPoliciesPatchResolver,
  deliveryPoliciesQueryResolver
} from './delivery-policies.schema'

import type { Application } from '../../declarations'
import { DeliveryPoliciesService, DeliveryModeTemplatesService, getOptions } from './delivery-policies.class'
import {
  deliveryPoliciesPath,
  deliveryModeTemplatesPath,
  deliveryPoliciesMethods
} from './delivery-policies.shared'
import { handleAction } from '../../cachedResources/order/'

export * from './delivery-policies.class'
export * from './delivery-policies.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const deliveryPolicies = (app: Application) => {
  // Register our service on the Feathers application
  app.use(deliveryPoliciesPath, new DeliveryPoliciesService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: deliveryPoliciesMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })

  app.use(deliveryModeTemplatesPath, new DeliveryModeTemplatesService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['find'],
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(deliveryPoliciesPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(deliveryPoliciesExternalResolver),
        schemaHooks.resolveResult(deliveryPoliciesResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(deliveryPoliciesQueryValidator),
        schemaHooks.resolveQuery(deliveryPoliciesQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(deliveryPoliciesDataValidator),
        schemaHooks.resolveData(deliveryPoliciesDataResolver)
      ],
      patch: [
        schemaHooks.validateData(deliveryPoliciesPatchValidator),
        schemaHooks.resolveData(deliveryPoliciesPatchResolver),
        async (context) => {
          if (context.id) {
            const previous = await context.service.get(context.id);
            context.params.previous = previous; // Store previous data
          }
          return context;
        },     
      ],
      remove: []
    },
    after: {
      all: [],
      create: [
        async (context) => {
          await handleAction('addDeliveryPolicy', context); // Add all zip codes associated with the policy to redis
          return context;
        }
      ],
      patch: [
        async (context) => {
          await handleAction('updateDeliveryPolicy', context);
          return context;
        }
      ],
      remove: [
        async (context) => {
          await handleAction('removeDeliveryPolicy', context); // Remove all zip codes associated with the policy from redis
          return context;
        }
      ]
    },
    error: {
      all: []
    }
  })

  app.service(deliveryModeTemplatesPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        })
      ]
    }
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [deliveryPoliciesPath]: DeliveryPoliciesService
    [deliveryModeTemplatesPath]: DeliveryModeTemplatesService
  }
}
