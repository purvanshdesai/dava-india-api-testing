import { Application } from '../../../declarations'
import { UsersAdminAccessService, getOptions } from '../users.class'
import { authenticate } from '@feathersjs/authentication'
import { usersAdminAccessPath } from '../users.shared'

export default function UsersAdminAccess(app: Application) {
  // Register our service on the Feathers application
  app.use(usersAdminAccessPath, new UsersAdminAccessService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['get', 'find', 'patch'],
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(usersAdminAccessPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        })
      ],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
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
