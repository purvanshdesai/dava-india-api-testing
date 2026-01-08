// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../../declarations'
import { dataValidator, queryValidator } from '../../../validators'
import type { SuperAdminUsersService } from './reset-password.class'

// Main data model schema
export const superAdminUsersSchema = Type.Object(
  {
    newPassword: Type.String()
  },
  { $id: 'SuperAdminUsersResetPassword', additionalProperties: false }
)
export type SuperAdminUsers = Static<typeof superAdminUsersSchema>
export const superAdminUsersValidator = getValidator(superAdminUsersSchema, dataValidator)
export const superAdminUsersResolver = resolve<SuperAdminUsers, HookContext<SuperAdminUsersService>>({})

export const superAdminUsersExternalResolver = resolve<SuperAdminUsers, HookContext<SuperAdminUsersService>>(
  {}
)

// Schema for creating new entries
export const superAdminUsersDataSchema = Type.Pick(superAdminUsersSchema, ['newPassword'], {
  $id: 'SuperAdminUsersDataResetPassword'
})
export type SuperAdminUsersData = Static<typeof superAdminUsersDataSchema>
export const superAdminUsersDataValidator = getValidator(superAdminUsersDataSchema, dataValidator)
export const superAdminUsersDataResolver = resolve<SuperAdminUsers, HookContext<SuperAdminUsersService>>({})

// Schema for updating existing entries
export const superAdminUsersPatchSchema = Type.Partial(superAdminUsersSchema, {
  $id: 'SuperAdminUsersPatchResetPassword'
})
export type SuperAdminUsersPatch = Static<typeof superAdminUsersPatchSchema>
export const superAdminUsersPatchValidator = getValidator(superAdminUsersPatchSchema, dataValidator)
export const superAdminUsersPatchResolver = resolve<SuperAdminUsers, HookContext<SuperAdminUsersService>>({})

// Schema for allowed query properties
export const superAdminUsersQueryProperties = Type.Pick(superAdminUsersSchema, [])
export const superAdminUsersQuerySchema = Type.Intersect(
  [
    querySyntax(superAdminUsersQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type SuperAdminUsersQuery = Static<typeof superAdminUsersQuerySchema>
export const superAdminUsersQueryValidator = getValidator(superAdminUsersQuerySchema, queryValidator)
export const superAdminUsersQueryResolver = resolve<
  SuperAdminUsersQuery,
  HookContext<SuperAdminUsersService>
>({})
