// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type {
  RequestSuperAdminOtp,
  RequestSuperAdminOtpData,
  RequestSuperAdminOtpPatch,
  RequestSuperAdminOtpQuery
} from './request-super-admin-otp.schema'
import { SuperAdminUsersModel } from '../super-admin-users/super-admin-users.schema'
import { generateRandomNumber } from '../../utils'
import moment from 'moment'

export type {
  RequestSuperAdminOtp,
  RequestSuperAdminOtpData,
  RequestSuperAdminOtpPatch,
  RequestSuperAdminOtpQuery
}

export interface RequestSuperAdminOtpServiceOptions {
  app: Application
}

export interface RequestSuperAdminOtpParams extends Params<RequestSuperAdminOtpQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class RequestSuperAdminOtpService {
  constructor(public options: RequestSuperAdminOtpServiceOptions) {}

  async create(data: RequestSuperAdminOtpData) {
    try {
      const superAdminUser = await SuperAdminUsersModel.findOne({ phoneNumber: data?.phoneNumber })
      if (!superAdminUser) return {}
      const otp = generateRandomNumber(5)

      await SuperAdminUsersModel.findOneAndUpdate(
        { phoneNumber: data?.phoneNumber },
        {
          otp,
          otpValidTill: moment().add(30, 'minutes')
        }
      )
      return {
        message: 'sent otp'
      }
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
