import type { Application } from '../../../declarations'
import { returnOrderPath, setTimestamp, validateUserOrderAccess } from '../order.shared'
import { ReturnOrderService } from '../order.class'

import { authenticateHook } from '../../../utils'

export const returnOrderEndPoint = (app: Application) => {
  app.use(returnOrderPath, new ReturnOrderService(), {
    // A list of all methods this service exposes externally
    methods: ['create'],
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(returnOrderPath).hooks({
    around: {
      all: [authenticateHook]
    },
    before: {
      create: [validateUserOrderAccess, setTimestamp]
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}
