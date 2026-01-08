import { Application } from '../../../declarations'
import { UserForgotPasswordService, UserResetPasswordService, getOptions } from '../users.class'
import {
  userPatchValidator,
  userQueryValidator,
  userResolver,
  userExternalResolver,
  userPatchResolver,
  userQueryResolver
} from '../users.schema'
import { hooks as schemaHooks } from '@feathersjs/schema'
import { userRequestResetPasswordPath } from '../users.shared'

export default function UserResetPassword(app: Application) {
  // Register our service on the Feathers application
  app.use(userRequestResetPasswordPath, new UserResetPasswordService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['find', 'get', 'create', 'patch', 'remove'],
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(userRequestResetPasswordPath).hooks({
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
      create: [],
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
