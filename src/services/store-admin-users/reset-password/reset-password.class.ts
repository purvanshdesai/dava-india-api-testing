// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../../declarations'
import type {
  StoreAdminUsersResetPassword,
  StoreAdminUsersResetPasswordData,
  StoreAdminUsersResetPasswordPatch,
  StoreAdminUsersResetPasswordQuery
} from './reset-password.schema'
import { StoreAdminUserModal } from '../store-admin-users.schema'
import { BadRequest } from '@feathersjs/errors'
import bcrypt from 'bcrypt'
import moment from 'moment'
import { StoreModel } from '../../stores/stores.schema'
import { DeliveryPoliciesModel } from '../../delivery-policies/delivery-policies.schema'

export type {
  StoreAdminUsersResetPassword,
  StoreAdminUsersResetPasswordData,
  StoreAdminUsersResetPasswordPatch,
  StoreAdminUsersResetPasswordQuery
}

export interface StoreAdminUsersResetPasswordServiceOptions {
  app: Application
}

export interface StoreAdminUsersResetPasswordParams extends Params<StoreAdminUsersResetPasswordQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class StoreAdminUsersResetPasswordService {
  constructor(public options: StoreAdminUsersResetPasswordServiceOptions) {}

  async get(id: Id) {
    try {
      const storeAdminUser = await StoreAdminUserModal.findOne({
        passwordResetToken: id
      }).lean()

      if (!storeAdminUser) {
        return {
          tokenValid: false
        }
      }

      if (!storeAdminUser?.passwordResetTokenExpiry)
        return {
          tokenValid: false
        }
      if (moment(storeAdminUser?.passwordResetTokenExpiry).isBefore(moment())) {
        return {
          tokenValid: false
        }
      }
      return {
        tokenValid: true
      }
    } catch (error) {
      throw error
    }
  }

  async create() {}

  async patch(id: Id, data: StoreAdminUsersResetPasswordPatch) {
    try {
      if (!data?.newPassword) throw new BadRequest('No password found')
      const storeAdminUser = await StoreAdminUserModal.findOne({
        passwordResetToken: id
      }).lean()
      if (!storeAdminUser) throw new BadRequest('Token invalid')

      await StoreAdminUserModal.updateOne(
        {
          passwordResetToken: id
        },
        {
          $set: {
            password: bcrypt.hashSync(data?.newPassword, 10),
            passwordResetToken: null,
            passwordResetTokenExpiry: null
          }
        }
      )
      await StoreModel.updateMany(
        {
          _id: {
            $in: storeAdminUser.storeIds
          }
        },
        {
          $set: {
            acceptedInvitation: true
          }
        }
      )
      const store = await StoreModel.findById(storeAdminUser.storeIds[0]).lean()
      if (store) {
        await DeliveryPoliciesModel.updateMany(
          {
            postalCodes: {
              $in: store.serviceableZip.map((item) => String(item))
            }
          },
          {
            $push: {
              stores: store._id
            }
          }
        )
      }
      return {
        message: 'Password set  successful'
      }
    } catch (error) {
      throw error
    }
  }

  async find() {}

  async remove() {}
}

export const getOptions = (app: Application) => {
  return { app }
}
