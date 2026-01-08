import type { Application } from '../../../declarations'
import { trackOrderPath, validateUserOrderAccess } from '../order.shared'
import { TrackOrderService } from '../order.class'

import { authenticateHook } from '../../../utils'

export const trackOrderEndPoint = (app: Application) => {
  app.use(trackOrderPath, new TrackOrderService(), {
    // A list of all methods this service exposes externally
    methods: ['find'],
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(trackOrderPath).hooks({
    around: {
      all: [
        // authenticateHook
      ]
    },
    before: {
      all: []
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}
