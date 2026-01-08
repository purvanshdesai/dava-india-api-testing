// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Params } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type {
  VerifyPhoneOtp,
  VerifyPhoneOtpData,
  VerifyPhoneOtpPatch,
  VerifyPhoneOtpQuery
} from './verify-phone-otp.schema'
import { UsersModel } from '../users/users.schema'
import { BadRequest } from '@feathersjs/errors'

export type { VerifyPhoneOtp, VerifyPhoneOtpData, VerifyPhoneOtpPatch, VerifyPhoneOtpQuery }

export interface VerifyPhoneOtpServiceOptions {
  app: Application
}

export interface VerifyPhoneOtpParams extends Params<VerifyPhoneOtpQuery> {}

const defaultOTP = '80910'
// This is a skeleton for a custom service class. Remove or add the methods you need here
export class VerifyPhoneOtpService<ServiceParams extends VerifyPhoneOtpParams = VerifyPhoneOtpParams> {
  constructor(public options: VerifyPhoneOtpServiceOptions) {}

  async create(data: VerifyPhoneOtpData, params?: ServiceParams): Promise<any> {
    try {
      const { phoneNumber, otp } = data
      const user = await UsersModel.findOne({ tempPhoneNumber: phoneNumber }).lean()
      if (!user) throw new BadRequest('Invalid otp')

      const defaultOtp = process.env.NODE_ENV === 'production' ? null : defaultOTP

      if (user?.phoneOtp == otp || otp === defaultOtp) {
        await UsersModel.findByIdAndUpdate(user?._id, {
          phoneNumber: user.tempPhoneNumber,
          tempPhoneNumber: null,
          accountVerified: true
        })
        return {
          message: 'User phone number verified'
        }
      }
      throw new Error('Invalid otp')
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
