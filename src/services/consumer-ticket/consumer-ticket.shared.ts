// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  ConsumerTicket,
  ConsumerTicketData,
  ConsumerTicketPatch,
  ConsumerTicketQuery,
  ConsumerTicketService
} from './consumer-ticket.class'

export type { ConsumerTicket, ConsumerTicketData, ConsumerTicketPatch, ConsumerTicketQuery }

export type ConsumerTicketClientService = Pick<ConsumerTicketService, (typeof consumerTicketMethods)[number]>

export const consumerTicketPath = 'consumer-ticket'

export const consumerTicketMethods: Array<keyof ConsumerTicketService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const consumerTicketClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(consumerTicketPath, connection.service(consumerTicketPath), {
    methods: consumerTicketMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [consumerTicketPath]: ConsumerTicketClientService
  }
}
