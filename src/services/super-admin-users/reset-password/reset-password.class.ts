// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../../declarations'
import type {
  SuperAdminUsers,
  SuperAdminUsersData,
  SuperAdminUsersPatch,
  SuperAdminUsersQuery
} from './reset-password.schema'
import moment from 'moment'
import { SuperAdminUsersModel } from '../super-admin-users.schema'
import { BadRequest } from '@feathersjs/errors'
import bcrypt from 'bcrypt'

export type { SuperAdminUsers, SuperAdminUsersData, SuperAdminUsersPatch, SuperAdminUsersQuery }

export interface SuperAdminUsersServiceOptions {
  app: Application
}

export interface SuperAdminUsersParams extends Params<SuperAdminUsersQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class SuperAdminUsersService {
  constructor(public options: SuperAdminUsersServiceOptions) {}

  async find() {}

  async get(id: Id) {
    try {
      const superAdminUser = await SuperAdminUsersModel.findOne({
        passwordResetToken: id
      }).lean()
      if (!superAdminUser) {
        return {
          tokenValid: false
        }
      }
      if (!superAdminUser?.passwordResetTokenExpiry)
        return {
          tokenValid: false
        }
      if (moment(superAdminUser?.passwordResetTokenExpiry).isBefore(moment())) {
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

  async update() {}

  async patch(id: Id, data: any) {
    try {
      if (!data?.newPassword) throw new BadRequest('No password found')
      const storeAdminUser = await SuperAdminUsersModel.findOne({
        passwordResetToken: id
      }).lean()
      if (!storeAdminUser) throw new BadRequest('Token invalid')

      await SuperAdminUsersModel.updateOne(
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
      return {
        message: 'Password set  successful'
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
