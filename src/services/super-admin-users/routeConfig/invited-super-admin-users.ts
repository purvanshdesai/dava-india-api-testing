import { Application } from '../../../declarations'
// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { InvitedSuperAdminUsersService, getOptions } from '../super-admin-users.class'
import { invitedSuperAdminUsersPath } from '../super-admin-users.shared'

export default function InvitedSuperAdminUsers(app: Application) {
  // Register our service on the Feathers application
  app.use(invitedSuperAdminUsersPath, new InvitedSuperAdminUsersService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['find'],
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(invitedSuperAdminUsersPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        })
      ]
    }
  })
}
