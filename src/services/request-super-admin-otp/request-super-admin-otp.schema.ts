// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { RequestSuperAdminOtpService } from './request-super-admin-otp.class'

// Main data model schema
export const requestSuperAdminOtpSchema = Type.Object(
  {
    phoneNumber: Type.String()
  },
  { $id: 'RequestSuperAdminOtp', additionalProperties: false }
)
export type RequestSuperAdminOtp = Static<typeof requestSuperAdminOtpSchema>
export const requestSuperAdminOtpValidator = getValidator(requestSuperAdminOtpSchema, dataValidator)
export const requestSuperAdminOtpResolver = resolve<
  RequestSuperAdminOtp,
  HookContext<RequestSuperAdminOtpService>
>({})

export const requestSuperAdminOtpExternalResolver = resolve<
  RequestSuperAdminOtp,
  HookContext<RequestSuperAdminOtpService>
>({})

// Schema for creating new entries
export const requestSuperAdminOtpDataSchema = Type.Pick(requestSuperAdminOtpSchema, ['phoneNumber'], {
  $id: 'RequestSuperAdminOtpData'
})
export type RequestSuperAdminOtpData = Static<typeof requestSuperAdminOtpDataSchema>
export const requestSuperAdminOtpDataValidator = getValidator(requestSuperAdminOtpDataSchema, dataValidator)
export const requestSuperAdminOtpDataResolver = resolve<
  RequestSuperAdminOtp,
  HookContext<RequestSuperAdminOtpService>
>({})

// Schema for updating existing entries
export const requestSuperAdminOtpPatchSchema = Type.Partial(requestSuperAdminOtpSchema, {
  $id: 'RequestSuperAdminOtpPatch'
})
export type RequestSuperAdminOtpPatch = Static<typeof requestSuperAdminOtpPatchSchema>
export const requestSuperAdminOtpPatchValidator = getValidator(requestSuperAdminOtpPatchSchema, dataValidator)
export const requestSuperAdminOtpPatchResolver = resolve<
  RequestSuperAdminOtp,
  HookContext<RequestSuperAdminOtpService>
>({})

// Schema for allowed query properties
export const requestSuperAdminOtpQueryProperties = Type.Pick(requestSuperAdminOtpSchema, [])
export const requestSuperAdminOtpQuerySchema = Type.Intersect(
  [
    querySyntax(requestSuperAdminOtpQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type RequestSuperAdminOtpQuery = Static<typeof requestSuperAdminOtpQuerySchema>
export const requestSuperAdminOtpQueryValidator = getValidator(
  requestSuperAdminOtpQuerySchema,
  queryValidator
)
export const requestSuperAdminOtpQueryResolver = resolve<
  RequestSuperAdminOtpQuery,
  HookContext<RequestSuperAdminOtpService>
>({})
