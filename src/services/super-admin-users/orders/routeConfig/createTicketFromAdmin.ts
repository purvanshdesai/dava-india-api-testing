import { createTickerFromAdminPath, createTicketFromAdminMethods } from '../orders.shared'
import { CreateTicketFromAdminService, getOptions } from '../orders.class'

import { Application } from '../../../../declarations'
import { authenticateHook } from '../../../../utils'

export default function CreateTicketFromAdminEndPoint(app: Application) {
  app.use(createTickerFromAdminPath, new CreateTicketFromAdminService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: createTicketFromAdminMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })

  app.service(createTickerFromAdminPath).hooks({
    around: {
      all: [authenticateHook]
    }
  })
}
