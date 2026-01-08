import { Application } from '../../../declarations'
import { cancelOrderPath, validateOrderUserForCancellation } from '../order.shared'
import { CancelOrderService } from '../order.class'
import { authenticateHook } from '../../../utils'

export const cancelOrderEndPoint = (app: Application) => {
  app.use(cancelOrderPath, new CancelOrderService(), {
    methods: ['create'],

    events: []
  })

  app.service(cancelOrderPath).hooks({
    around: {
      all: [
        authenticateHook
        // schemaHooks.resolveExternal(orderConsultationExternalResolver),
        // schemaHooks.resolveResult(orderConsultationResolver)
      ]
    },
    before: {
      create: [validateOrderUserForCancellation]
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}
