// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Support, SupportData, SupportPatch, SupportQuery, SupportService } from './support.class'

export type { Support, SupportData, SupportPatch, SupportQuery }

export type SupportClientService = Pick<SupportService<Params<SupportQuery>>, (typeof supportMethods)[number]>

export const supportPath = 'support/tickets/:ticketId/activities'

export const supportMethods: Array<keyof SupportService> = ['find', 'create', 'remove']

export const supportClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(supportPath, connection.service(supportPath), {
    methods: supportMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [supportPath]: SupportClientService
  }
}
