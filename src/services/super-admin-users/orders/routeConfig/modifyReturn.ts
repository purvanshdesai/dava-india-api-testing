import { Application } from '../../../../declarations'
import { modifyReturnPath } from '../orders.shared'
import { ModifyReturnService } from '../orders.class'
import { authenticateHook } from '../../../../utils'

export const modifyReturnEndPoint = (app: Application) => {
  app.use(modifyReturnPath, new ModifyReturnService(app), {
    methods: ['create'],

    events: []
  })

  app.service(modifyReturnPath).hooks({
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
