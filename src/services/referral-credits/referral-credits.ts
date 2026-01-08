// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  referralCreditsDataValidator,
  referralCreditsPatchValidator,
  referralCreditsQueryValidator,
  referralCreditsResolver,
  referralCreditsExternalResolver,
  referralCreditsDataResolver,
  referralCreditsPatchResolver,
  referralCreditsQueryResolver
} from './referral-credits.schema'

import type { Application } from '../../declarations'
import { ReferralCreditsService, getOptions } from './referral-credits.class'
import { referralCreditsPath, referralCreditsMethods } from './referral-credits.shared'

export * from './referral-credits.class'
export * from './referral-credits.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const referralCredits = (app: Application) => {
  // Register our service on the Feathers application
  app.use(referralCreditsPath, new ReferralCreditsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: referralCreditsMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(referralCreditsPath).hooks({
    around: {
      all: [
        authenticate('jwt'),
        schemaHooks.resolveExternal(referralCreditsExternalResolver),
        schemaHooks.resolveResult(referralCreditsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(referralCreditsQueryValidator),
        schemaHooks.resolveQuery(referralCreditsQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(referralCreditsDataValidator),
        schemaHooks.resolveData(referralCreditsDataResolver)
      ],
      patch: [
        schemaHooks.validateData(referralCreditsPatchValidator),
        schemaHooks.resolveData(referralCreditsPatchResolver)
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
    [referralCreditsPath]: ReferralCreditsService
  }
}
