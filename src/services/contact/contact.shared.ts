// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Contact, ContactData, ContactPatch, ContactQuery, ContactService } from './contact.class'

export type { Contact, ContactData, ContactPatch, ContactQuery }

export type ContactClientService = Pick<ContactService<Params<ContactQuery>>, (typeof contactMethods)[number]>

export const contactPath = 'contact-us'

export const contactMethods: Array<keyof ContactService> = ['find', 'get', 'create', 'patch', 'remove']

export const contactClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(contactPath, connection.service(contactPath), {
    methods: contactMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [contactPath]: ContactClientService
  }
}
