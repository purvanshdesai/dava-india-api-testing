// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../../declarations'
import type {
  StoreAdminUsersForgotPassword,
  StoreAdminUsersForgotPasswordData,
  StoreAdminUsersForgotPasswordPatch,
  StoreAdminUsersForgotPasswordQuery
} from './forgot-password.schema'
import { StoreAdminUserModal } from '../store-admin-users.schema'
import { randomBytes } from 'crypto'
import moment from 'moment'
import { sendEmail } from '../../../utils/sendEmail'
import storeAdminResetPassword from '../../../templates/storeAdminResetPassword'
import { feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'

const app = feathers().configure(configuration())

export type {
  StoreAdminUsersForgotPassword,
  StoreAdminUsersForgotPasswordData,
  StoreAdminUsersForgotPasswordPatch,
  StoreAdminUsersForgotPasswordQuery
}

export interface StoreAdminUsersForgotPasswordServiceOptions {
  app: Application
}

export interface StoreAdminUsersForgotPasswordParams extends Params<StoreAdminUsersForgotPasswordQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class StoreAdminUsersForgotPasswordService {
  constructor(public options: StoreAdminUsersForgotPasswordServiceOptions) {}

  async find() {}
  async get() {}

  async create(data: StoreAdminUsersForgotPasswordData, params: Params<StoreAdminUsersForgotPasswordQuery>) {
    try {
      const user = await StoreAdminUserModal.findOne({ email: data?.email }).lean()
      if (user) {
        let randomData = randomBytes(30).toString('hex')
        await StoreAdminUserModal.findOneAndUpdate(
          { email: data.email },
          {
            passwordResetToken: randomData,
            passwordResetTokenExpiry: moment().add(30, 'minutes')
          }
        )
        sendEmail({
          to: user.email,
          subject: 'Store invitation',
          message: storeAdminResetPassword({
            url: `${app.get('web')}/store-reset-password?token=${randomData}`
          }),
          attachments: []
        })
      }
      return {
        message: 'Sent reset password mail'
      }
    } catch (error) {
      throw error
    }
  }

  // This method has to be added to the 'methods' option to make it available to clients
  async update() {}

  async patch() {}

  async remove() {}
}

export const getOptions = (app: Application) => {
  return { app }
}
