// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { VerifyPhoneOtpService } from './verify-phone-otp.class'

// Main data model schema
export const verifyPhoneOtpSchema = Type.Object(
  {
    phoneNumber: Type.String(),
    otp: Type.String()
  },
  { $id: 'VerifyPhoneOtp', additionalProperties: false }
)
export type VerifyPhoneOtp = Static<typeof verifyPhoneOtpSchema>
export const verifyPhoneOtpValidator = getValidator(verifyPhoneOtpSchema, dataValidator)
export const verifyPhoneOtpResolver = resolve<VerifyPhoneOtp, HookContext<VerifyPhoneOtpService>>({})

export const verifyPhoneOtpExternalResolver = resolve<VerifyPhoneOtp, HookContext<VerifyPhoneOtpService>>({})

// Schema for creating new entries
export const verifyPhoneOtpDataSchema = Type.Pick(verifyPhoneOtpSchema, ['phoneNumber', 'otp'], {
  $id: 'VerifyPhoneOtpData'
})
export type VerifyPhoneOtpData = Static<typeof verifyPhoneOtpDataSchema>
export const verifyPhoneOtpDataValidator = getValidator(verifyPhoneOtpDataSchema, dataValidator)
export const verifyPhoneOtpDataResolver = resolve<VerifyPhoneOtp, HookContext<VerifyPhoneOtpService>>({})

// Schema for updating existing entries
export const verifyPhoneOtpPatchSchema = Type.Partial(verifyPhoneOtpSchema, {
  $id: 'VerifyPhoneOtpPatch'
})
export type VerifyPhoneOtpPatch = Static<typeof verifyPhoneOtpPatchSchema>
export const verifyPhoneOtpPatchValidator = getValidator(verifyPhoneOtpPatchSchema, dataValidator)
export const verifyPhoneOtpPatchResolver = resolve<VerifyPhoneOtp, HookContext<VerifyPhoneOtpService>>({})

// Schema for allowed query properties
export const verifyPhoneOtpQueryProperties = Type.Pick(verifyPhoneOtpSchema, [])
export const verifyPhoneOtpQuerySchema = Type.Intersect(
  [
    querySyntax(verifyPhoneOtpQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type VerifyPhoneOtpQuery = Static<typeof verifyPhoneOtpQuerySchema>
export const verifyPhoneOtpQueryValidator = getValidator(verifyPhoneOtpQuerySchema, queryValidator)
export const verifyPhoneOtpQueryResolver = resolve<VerifyPhoneOtpQuery, HookContext<VerifyPhoneOtpService>>(
  {}
)
