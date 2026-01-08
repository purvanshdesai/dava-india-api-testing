import { Application } from '../../../declarations'
import { UserAccountService, getOptions } from '../users.class'
import { userAccountPath } from '../users.shared'
import { authenticate } from '@feathersjs/authentication'

export default function UserAccount(app: Application) {
  // Register our service on the Feathers application
  app.use(userAccountPath, new UserAccountService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['find'],
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(userAccountPath).hooks({
    around: {
      all: [authenticate('jwt')],
      find: []
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
