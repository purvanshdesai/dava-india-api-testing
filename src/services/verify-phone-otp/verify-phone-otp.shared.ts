// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  VerifyPhoneOtp,
  VerifyPhoneOtpData,
  VerifyPhoneOtpPatch,
  VerifyPhoneOtpQuery,
  VerifyPhoneOtpService
} from './verify-phone-otp.class'

export type { VerifyPhoneOtp, VerifyPhoneOtpData, VerifyPhoneOtpPatch, VerifyPhoneOtpQuery }

export type VerifyPhoneOtpClientService = Pick<
  VerifyPhoneOtpService<Params<VerifyPhoneOtpQuery>>,
  (typeof verifyPhoneOtpMethods)[number]
>

export const verifyPhoneOtpPath = 'verify-phone-otp'

export const verifyPhoneOtpMethods: Array<keyof VerifyPhoneOtpService> = ['create']

export const verifyPhoneOtpClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(verifyPhoneOtpPath, connection.service(verifyPhoneOtpPath), {
    methods: verifyPhoneOtpMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [verifyPhoneOtpPath]: VerifyPhoneOtpClientService
  }
}
