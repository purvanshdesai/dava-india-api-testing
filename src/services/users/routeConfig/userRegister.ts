import { Application } from '../../../declarations'
import { UserRegisterService, getOptions, UserParams } from '../users.class'
import {
  userDataValidator,
  userPatchValidator,
  userQueryValidator,
  userResolver,
  userExternalResolver,
  userDataResolver,
  userPatchResolver,
  userQueryResolver
} from '../users.schema'
import { hooks as schemaHooks } from '@feathersjs/schema'
import { userRegisterPath } from '../users.shared'

export default function UserRegister(app: Application) {
  // Register our service on the Feathers application
  app.use(userRegisterPath, new UserRegisterService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['create', 'get', 'patch'],
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(userRegisterPath).hooks({
    around: {
      all: [schemaHooks.resolveExternal(userExternalResolver), schemaHooks.resolveResult(userResolver)],
      find: [],
      get: [],
      create: []
    },
    before: {
      all: [schemaHooks.validateQuery(userQueryValidator), schemaHooks.resolveQuery(userQueryResolver)],
      find: [],
      get: [],
      create: [schemaHooks.validateData(userDataValidator), schemaHooks.resolveData(userDataResolver)],
      patch: [schemaHooks.validateData(userPatchValidator), schemaHooks.resolveData(userPatchResolver)],
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
