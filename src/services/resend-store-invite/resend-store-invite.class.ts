// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type {
  ResendStoreInvite,
  ResendStoreInviteData,
  ResendStoreInvitePatch,
  ResendStoreInviteQuery
} from './resend-store-invite.schema'
import { StoreModel } from '../stores/stores.schema'
import { BadRequest } from '@feathersjs/errors'
import { StoreAdminUserModal } from '../store-admin-users/store-admin-users.schema'
import { randomBytes } from 'crypto'
import { sendEmail } from '../../utils/sendEmail'
import invite from '../../utils/templates/invite'
import moment from 'moment'
import storeAdminInvitation from '../../templates/storeAdminInvitation'
import { feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'

const app = feathers().configure(configuration())

export type { ResendStoreInvite, ResendStoreInviteData, ResendStoreInvitePatch, ResendStoreInviteQuery }

export interface ResendStoreInviteServiceOptions {
  app: Application
}

export interface ResendStoreInviteParams extends Params<ResendStoreInviteQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class ResendStoreInviteService {
  constructor(public options: ResendStoreInviteServiceOptions) {}

  async find() {}

  async get() {}

  async create() {}

  // This method has to be added to the 'methods' option to make it available to clients
  async update() {}

  async patch(id: Id) {
    try {
      let randomData = randomBytes(15).toString('hex')
      const store = await StoreModel.findById(id).lean()
      if (!store) throw new BadRequest('No store found')
      await StoreAdminUserModal.findOneAndUpdate(
        {
          email: store.email
        },
        {
          passwordResetToken: randomData,
          passwordResetTokenExpiry: moment().add(24, 'hours')
        },
        {
          new: true
        }
      )

      sendEmail({
        to: store.email,
        subject: 'Store invitation',
        message: storeAdminInvitation({
          url: `${app.get('web')}/store-reset-password?token=${randomData}`
        }),
        attachments: []
      })
      return {
        message: 'Resent invitation'
      }
    } catch (error) {
      throw error
    }
  }

  async remove() {}
}

export const getOptions = (app: Application) => {
  return { app }
}
