import type { Application } from '../../../declarations'
import { shiprocketTrackingMethods, shiprocketTrackingPath } from '../webhooks.shared'
import { getOptions, ShiprocketTrackingService } from '../webhooks.class'

export const ShiprocketTrackingEndPoint = (app: Application) => {
  // Register our service on the Feathers application
  app.use(shiprocketTrackingPath, new ShiprocketTrackingService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: shiprocketTrackingMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(shiprocketTrackingPath).hooks({
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
