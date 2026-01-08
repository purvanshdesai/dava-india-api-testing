import { Application } from '../../../../declarations'
import { cancelOrderActionPath } from '../orders.shared'
import { CancelOrderActionsService } from '../orders.class'
import { authenticateHook } from '../../../../utils'

export const cancelOrderEndPoint = (app: Application) => {
  app.use(cancelOrderActionPath, new CancelOrderActionsService(app), {
    methods: ['create'],

    events: []
  })

  app.service(cancelOrderActionPath).hooks({
    around: {
      all: [authenticateHook]
    },
    before: {
      create: []
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}
