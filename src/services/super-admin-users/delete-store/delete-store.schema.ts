// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../../declarations'
import { dataValidator, queryValidator } from '../../../validators'
import type { SuperAdminUsersDeleteStoreService } from './delete-store.class'

// Main data model schema
export const superAdminUsersDeleteStoreSchema = Type.Object(
  {},
  { $id: 'SuperAdminUsersDeleteStore', additionalProperties: false }
)
export type SuperAdminUsersDeleteStore = Static<typeof superAdminUsersDeleteStoreSchema>
export const superAdminUsersDeleteStoreValidator = getValidator(
  superAdminUsersDeleteStoreSchema,
  dataValidator
)
export const superAdminUsersDeleteStoreResolver = resolve<
  SuperAdminUsersDeleteStore,
  HookContext<SuperAdminUsersDeleteStoreService>
>({})

export const superAdminUsersDeleteStoreExternalResolver = resolve<
  SuperAdminUsersDeleteStore,
  HookContext<SuperAdminUsersDeleteStoreService>
>({})

// Schema for creating new entries
export const superAdminUsersDeleteStoreDataSchema = Type.Pick(superAdminUsersDeleteStoreSchema, [], {
  $id: 'SuperAdminUsersDeleteStoreData'
})
export type SuperAdminUsersDeleteStoreData = Static<typeof superAdminUsersDeleteStoreDataSchema>
export const superAdminUsersDeleteStoreDataValidator = getValidator(
  superAdminUsersDeleteStoreDataSchema,
  dataValidator
)
export const superAdminUsersDeleteStoreDataResolver = resolve<
  SuperAdminUsersDeleteStore,
  HookContext<SuperAdminUsersDeleteStoreService>
>({})

// Schema for updating existing entries
export const superAdminUsersDeleteStorePatchSchema = Type.Partial(superAdminUsersDeleteStoreSchema, {
  $id: 'SuperAdminUsersDeleteStorePatch'
})
export type SuperAdminUsersDeleteStorePatch = Static<typeof superAdminUsersDeleteStorePatchSchema>
export const superAdminUsersDeleteStorePatchValidator = getValidator(
  superAdminUsersDeleteStorePatchSchema,
  dataValidator
)
export const superAdminUsersDeleteStorePatchResolver = resolve<
  SuperAdminUsersDeleteStore,
  HookContext<SuperAdminUsersDeleteStoreService>
>({})

// Schema for allowed query properties
export const superAdminUsersDeleteStoreQueryProperties = Type.Pick(superAdminUsersDeleteStoreSchema, [])
export const superAdminUsersDeleteStoreQuerySchema = Type.Intersect(
  [
    querySyntax(superAdminUsersDeleteStoreQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type SuperAdminUsersDeleteStoreQuery = Static<typeof superAdminUsersDeleteStoreQuerySchema>
export const superAdminUsersDeleteStoreQueryValidator = getValidator(
  superAdminUsersDeleteStoreQuerySchema,
  queryValidator
)
export const superAdminUsersDeleteStoreQueryResolver = resolve<
  SuperAdminUsersDeleteStoreQuery,
  HookContext<SuperAdminUsersDeleteStoreService>
>({})
