// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../../declarations'
import { dataValidator, queryValidator } from '../../../validators'
import type { StoreAdminUsersForgotPasswordService } from './forgot-password.class'

// Main data model schema
export const storeAdminUsersForgotPasswordSchema = Type.Object(
  {
    email: Type.String()
  },
  { $id: 'StoreAdminUsersForgotPassword', additionalProperties: false }
)
export type StoreAdminUsersForgotPassword = Static<typeof storeAdminUsersForgotPasswordSchema>
export const storeAdminUsersForgotPasswordValidator = getValidator(
  storeAdminUsersForgotPasswordSchema,
  dataValidator
)
export const storeAdminUsersForgotPasswordResolver = resolve<
  StoreAdminUsersForgotPassword,
  HookContext<StoreAdminUsersForgotPasswordService>
>({})

export const storeAdminUsersForgotPasswordExternalResolver = resolve<
  StoreAdminUsersForgotPassword,
  HookContext<StoreAdminUsersForgotPasswordService>
>({})

// Schema for creating new entries
export const storeAdminUsersForgotPasswordDataSchema = Type.Pick(
  storeAdminUsersForgotPasswordSchema,
  ['email'],
  {
    $id: 'StoreAdminUsersForgotPasswordData'
  }
)
export type StoreAdminUsersForgotPasswordData = Static<typeof storeAdminUsersForgotPasswordDataSchema>
export const storeAdminUsersForgotPasswordDataValidator = getValidator(
  storeAdminUsersForgotPasswordDataSchema,
  dataValidator
)
export const storeAdminUsersForgotPasswordDataResolver = resolve<
  StoreAdminUsersForgotPassword,
  HookContext<StoreAdminUsersForgotPasswordService>
>({})

// Schema for updating existing entries
export const storeAdminUsersForgotPasswordPatchSchema = Type.Partial(storeAdminUsersForgotPasswordSchema, {
  $id: 'StoreAdminUsersForgotPasswordPatch'
})
export type StoreAdminUsersForgotPasswordPatch = Static<typeof storeAdminUsersForgotPasswordPatchSchema>
export const storeAdminUsersForgotPasswordPatchValidator = getValidator(
  storeAdminUsersForgotPasswordPatchSchema,
  dataValidator
)
export const storeAdminUsersForgotPasswordPatchResolver = resolve<
  StoreAdminUsersForgotPassword,
  HookContext<StoreAdminUsersForgotPasswordService>
>({})

// Schema for allowed query properties
export const storeAdminUsersForgotPasswordQueryProperties = Type.Pick(storeAdminUsersForgotPasswordSchema, [])
export const storeAdminUsersForgotPasswordQuerySchema = Type.Intersect(
  [
    querySyntax(storeAdminUsersForgotPasswordQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type StoreAdminUsersForgotPasswordQuery = Static<typeof storeAdminUsersForgotPasswordQuerySchema>
export const storeAdminUsersForgotPasswordQueryValidator = getValidator(
  storeAdminUsersForgotPasswordQuerySchema,
  queryValidator
)
export const storeAdminUsersForgotPasswordQueryResolver = resolve<
  StoreAdminUsersForgotPasswordQuery,
  HookContext<StoreAdminUsersForgotPasswordService>
>({})
