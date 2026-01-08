// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type { Contact, ContactData, ContactPatch, ContactQuery } from './contact.schema'
import { sendEmail } from '../../utils/sendEmail'
import ContactUsTemplate from '../../templates/contact'

export type { Contact, ContactData, ContactPatch, ContactQuery }

export interface ContactServiceOptions {
  app: Application
}

export interface ContactParams extends Params<ContactQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class ContactService<ServiceParams extends ContactParams = ContactParams>
  implements ServiceInterface<Contact, ContactData, ServiceParams, ContactPatch>
{
  constructor(public options: ContactServiceOptions) {}

  async find(_params?: ServiceParams): Promise<Contact[]> {
    return []
  }

  async get(id: Id, _params?: ServiceParams): Promise<any> {
    return {}
  }

  async create(data: ContactData, params?: ServiceParams): Promise<any> {
    try {
      await sendEmail({
        to: data?.email,
        cc: ['davaindia@davaindia.com'],
        subject: 'Davaindia: Thank You for Your Query',
        message: ContactUsTemplate(data),
        attachments: []
      })
      return { message: 'Message sent!' }
    } catch (e) {}
  }

  // This method has to be added to the 'methods' option to make it available to clients
  async update(id: NullableId, data: ContactData, _params?: ServiceParams): Promise<Contact> {
    return {
      id: 0,
      ...data
    }
  }

  async patch(id: NullableId, data: ContactPatch, _params?: ServiceParams): Promise<any> {
    return {
      id: 0,
      ...data
    }
  }

  async remove(id: NullableId, _params?: ServiceParams): Promise<any> {
    return {
      id: 0
    }
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
