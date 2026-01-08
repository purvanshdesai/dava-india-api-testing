// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  RequestSuperAdminOtp,
  RequestSuperAdminOtpData,
  RequestSuperAdminOtpPatch,
  RequestSuperAdminOtpQuery,
  RequestSuperAdminOtpService
} from './request-super-admin-otp.class'

export type {
  RequestSuperAdminOtp,
  RequestSuperAdminOtpData,
  RequestSuperAdminOtpPatch,
  RequestSuperAdminOtpQuery
}

export const requestSuperAdminOtpPath = 'request-super-admin-otp'

export const requestSuperAdminOtpMethods: Array<keyof RequestSuperAdminOtpService> = ['create']
