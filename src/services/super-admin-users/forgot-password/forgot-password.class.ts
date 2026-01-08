// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../../declarations'
import type {
  SuperAdminUserForgotPassword,
  SuperAdminUserForgotPasswordData,
  SuperAdminUserForgotPasswordPatch,
  SuperAdminUserForgotPasswordQuery
} from './forgot-password.schema'
import { SuperAdminUsersModel } from '../super-admin-users.schema'
import { randomBytes } from 'crypto'
import moment from 'moment'
import { sendEmail } from '../../../utils/sendEmail'
import storeAdminResetPassword from '../../../templates/storeAdminResetPassword'
import { feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'

const app = feathers().configure(configuration())

export type {
  SuperAdminUserForgotPassword,
  SuperAdminUserForgotPasswordData,
  SuperAdminUserForgotPasswordPatch,
  SuperAdminUserForgotPasswordQuery
}

export interface SuperAdminUserForgotPasswordServiceOptions {
  app: Application
}

export interface SuperAdminUserForgotPasswordParams extends Params<SuperAdminUserForgotPasswordQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class SuperAdminUserForgotPasswordService {
  constructor(public options: SuperAdminUserForgotPasswordServiceOptions) {}

  async find() {
    return []
  }

  async get() {
    return {
      id: 0
    }
  }

  async create(data: SuperAdminUserForgotPasswordData, params: Params<SuperAdminUserForgotPasswordQuery>) {
    try {
      const user = await SuperAdminUsersModel.findOne({ email: data?.email }).lean()
      if (user) {
        let randomData = randomBytes(30).toString('hex')
        await SuperAdminUsersModel.findOneAndUpdate(
          { email: data.email },
          {
            passwordResetToken: randomData,
            passwordResetTokenExpiry: moment().add(30, 'minutes')
          }
        )
        sendEmail({
          to: user.email as string,
          subject: 'Password Reset',
          message: storeAdminResetPassword({
            url: `${app.get('web')}/super-admin/reset-password?token=${randomData}`
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
