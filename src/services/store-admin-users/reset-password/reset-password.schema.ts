// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../../declarations'
import { dataValidator, queryValidator } from '../../../validators'
import type { StoreAdminUsersResetPasswordService } from './reset-password.class'

// Main data model schema
export const storeAdminUsersResetPasswordSchema = Type.Object(
  {
    newPassword: Type.String()
  },
  { $id: 'StoreAdminUsersResetPassword', additionalProperties: false }
)
export type StoreAdminUsersResetPassword = Static<typeof storeAdminUsersResetPasswordSchema>
export const storeAdminUsersResetPasswordValidator = getValidator(
  storeAdminUsersResetPasswordSchema,
  dataValidator
)
export const storeAdminUsersResetPasswordResolver = resolve<
  StoreAdminUsersResetPassword,
  HookContext<StoreAdminUsersResetPasswordService>
>({})

export const storeAdminUsersResetPasswordExternalResolver = resolve<
  StoreAdminUsersResetPassword,
  HookContext<StoreAdminUsersResetPasswordService>
>({})

// Schema for creating new entries
export const storeAdminUsersResetPasswordDataSchema = Type.Pick(storeAdminUsersResetPasswordSchema, [], {
  $id: 'StoreAdminUsersResetPasswordData'
})
export type StoreAdminUsersResetPasswordData = Static<typeof storeAdminUsersResetPasswordDataSchema>
export const storeAdminUsersResetPasswordDataValidator = getValidator(
  storeAdminUsersResetPasswordDataSchema,
  dataValidator
)
export const storeAdminUsersResetPasswordDataResolver = resolve<
  StoreAdminUsersResetPassword,
  HookContext<StoreAdminUsersResetPasswordService>
>({})

// Schema for updating existing entries
export const storeAdminUsersResetPasswordPatchSchema = Type.Partial(storeAdminUsersResetPasswordSchema, {
  $id: 'StoreAdminUsersResetPasswordPatch'
})
export type StoreAdminUsersResetPasswordPatch = Static<typeof storeAdminUsersResetPasswordPatchSchema>
export const storeAdminUsersResetPasswordPatchValidator = getValidator(
  storeAdminUsersResetPasswordPatchSchema,
  dataValidator
)
export const storeAdminUsersResetPasswordPatchResolver = resolve<
  StoreAdminUsersResetPassword,
  HookContext<StoreAdminUsersResetPasswordService>
>({})

// Schema for allowed query properties
export const storeAdminUsersResetPasswordQueryProperties = Type.Pick(storeAdminUsersResetPasswordSchema, [
  'newPassword'
])
export const storeAdminUsersResetPasswordQuerySchema = Type.Intersect(
  [
    querySyntax(storeAdminUsersResetPasswordQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type StoreAdminUsersResetPasswordQuery = Static<typeof storeAdminUsersResetPasswordQuerySchema>
export const storeAdminUsersResetPasswordQueryValidator = getValidator(
  storeAdminUsersResetPasswordQuerySchema,
  queryValidator
)
export const storeAdminUsersResetPasswordQueryResolver = resolve<
  StoreAdminUsersResetPasswordQuery,
  HookContext<StoreAdminUsersResetPasswordService>
>({})
