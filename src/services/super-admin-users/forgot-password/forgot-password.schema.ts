// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../../declarations'
import { dataValidator, queryValidator } from '../../../validators'
import type { SuperAdminUserForgotPasswordService } from './forgot-password.class'

// Main data model schema
export const superAdminUserForgotPasswordSchema = Type.Object(
  {
    email: Type.String()
  },
  { $id: 'SuperAdminUserForgotPassword', additionalProperties: false }
)
export type SuperAdminUserForgotPassword = Static<typeof superAdminUserForgotPasswordSchema>
export const superAdminUserForgotPasswordValidator = getValidator(
  superAdminUserForgotPasswordSchema,
  dataValidator
)
export const superAdminUserForgotPasswordResolver = resolve<
  SuperAdminUserForgotPassword,
  HookContext<SuperAdminUserForgotPasswordService>
>({})

export const superAdminUserForgotPasswordExternalResolver = resolve<
  SuperAdminUserForgotPassword,
  HookContext<SuperAdminUserForgotPasswordService>
>({})

// Schema for creating new entries
export const superAdminUserForgotPasswordDataSchema = Type.Pick(
  superAdminUserForgotPasswordSchema,
  ['email'],
  {
    $id: 'SuperAdminUserForgotPasswordData'
  }
)
export type SuperAdminUserForgotPasswordData = Static<typeof superAdminUserForgotPasswordDataSchema>
export const superAdminUserForgotPasswordDataValidator = getValidator(
  superAdminUserForgotPasswordDataSchema,
  dataValidator
)
export const superAdminUserForgotPasswordDataResolver = resolve<
  SuperAdminUserForgotPassword,
  HookContext<SuperAdminUserForgotPasswordService>
>({})

// Schema for updating existing entries
export const superAdminUserForgotPasswordPatchSchema = Type.Partial(superAdminUserForgotPasswordSchema, {
  $id: 'SuperAdminUserForgotPasswordPatch'
})
export type SuperAdminUserForgotPasswordPatch = Static<typeof superAdminUserForgotPasswordPatchSchema>
export const superAdminUserForgotPasswordPatchValidator = getValidator(
  superAdminUserForgotPasswordPatchSchema,
  dataValidator
)
export const superAdminUserForgotPasswordPatchResolver = resolve<
  SuperAdminUserForgotPassword,
  HookContext<SuperAdminUserForgotPasswordService>
>({})

// Schema for allowed query properties
export const superAdminUserForgotPasswordQueryProperties = Type.Pick(superAdminUserForgotPasswordSchema, [])
export const superAdminUserForgotPasswordQuerySchema = Type.Intersect(
  [
    querySyntax(superAdminUserForgotPasswordQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type SuperAdminUserForgotPasswordQuery = Static<typeof superAdminUserForgotPasswordQuerySchema>
export const superAdminUserForgotPasswordQueryValidator = getValidator(
  superAdminUserForgotPasswordQuerySchema,
  queryValidator
)
export const superAdminUserForgotPasswordQueryResolver = resolve<
  SuperAdminUserForgotPasswordQuery,
  HookContext<SuperAdminUserForgotPasswordService>
>({})
