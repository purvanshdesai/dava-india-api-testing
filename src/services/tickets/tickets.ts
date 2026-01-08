// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import type { Application } from '../../declarations'
import { TicketsService, TicketsSuperAdminService, getOptions, TicketsAssigneeService } from './tickets.class'
import { ticketsPath, ticketsSuperAdminPath, ticketsMethods, ticketsAssigneePath } from './tickets.shared'
import TicketsConsumerEndPoint from './routeConfig/consumer'
import TicketsSuperAdminEndPoint from './routeConfig/superAdmin'
import TicketsAssigneeEndPoint from './routeConfig/assignee'

export * from './tickets.class'
export * from './tickets.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const tickets = (app: Application) => {
  TicketsConsumerEndPoint(app)
  TicketsSuperAdminEndPoint(app)
  TicketsAssigneeEndPoint(app)
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [ticketsPath]: TicketsService
    [ticketsSuperAdminPath]: TicketsSuperAdminService
    [ticketsAssigneePath]: TicketsAssigneeService
  }
}
