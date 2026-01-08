import type { Application } from '../../../declarations'
import { shiprocketQuickTrackingMethods, shiprocketQuickTrackingPath } from '../webhooks.shared'
import { getOptions, ShiprocketQuickTrackingService } from '../webhooks.class'

export const ShiprocketQuickTrackingEndPoint = (app: Application) => {
  // Register our service on the Feathers application
  app.use(shiprocketQuickTrackingPath, new ShiprocketQuickTrackingService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: shiprocketQuickTrackingMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(shiprocketQuickTrackingPath).hooks({
    around: {
      all: []
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
}
