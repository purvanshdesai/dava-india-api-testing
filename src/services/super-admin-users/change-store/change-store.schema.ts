// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../../declarations'
import { dataValidator, queryValidator } from '../../../validators'
import type { SuperAdminUsersChangeStoreService } from './change-store.class'

// Main data model schema
export const superAdminUsersChangeStoreSchema = Type.Object(
  {
    storeId: Type.String(),
    transferredStoreId: Type.String(),
    currentStoreId: Type.String(),
    orderId: Type.String(),
    cancelReason: Type.String(),
    comment: Type.String(),
    transferType: Type.Optional(Type.String()),
    selectedProducts: Type.Optional(Type.Array(Type.Any()))
  },
  { $id: 'SuperAdminUsersChangeStore', additionalProperties: false }
)
export type SuperAdminUsersChangeStore = Static<typeof superAdminUsersChangeStoreSchema>
export const superAdminUsersChangeStoreValidator = getValidator(
  superAdminUsersChangeStoreSchema,
  dataValidator
)
export const superAdminUsersChangeStoreResolver = resolve<
  SuperAdminUsersChangeStore,
  HookContext<SuperAdminUsersChangeStoreService>
>({})

export const superAdminUsersChangeStoreExternalResolver = resolve<
  SuperAdminUsersChangeStore,
  HookContext<SuperAdminUsersChangeStoreService>
>({})

// Schema for creating new entries
export const superAdminUsersChangeStoreDataSchema = Type.Pick(
  superAdminUsersChangeStoreSchema,
  [
    'transferredStoreId',
    'orderId',
    'currentStoreId',
    'cancelReason',
    'comment',
    'transferType',
    'selectedProducts'
  ],
  {
    $id: 'SuperAdminUsersChangeStoreData'
  }
)
export type SuperAdminUsersChangeStoreData = Static<typeof superAdminUsersChangeStoreDataSchema>
export const superAdminUsersChangeStoreDataValidator = getValidator(
  superAdminUsersChangeStoreDataSchema,
  dataValidator
)
export const superAdminUsersChangeStoreDataResolver = resolve<
  SuperAdminUsersChangeStore,
  HookContext<SuperAdminUsersChangeStoreService>
>({})

// Schema for updating existing entries
export const superAdminUsersChangeStorePatchSchema = Type.Partial(superAdminUsersChangeStoreSchema, {
  $id: 'SuperAdminUsersChangeStorePatch'
})
export type SuperAdminUsersChangeStorePatch = Static<typeof superAdminUsersChangeStorePatchSchema>
export const superAdminUsersChangeStorePatchValidator = getValidator(
  superAdminUsersChangeStorePatchSchema,
  dataValidator
)
export const superAdminUsersChangeStorePatchResolver = resolve<
  SuperAdminUsersChangeStore,
  HookContext<SuperAdminUsersChangeStoreService>
>({})

// Schema for allowed query properties
export const superAdminUsersChangeStoreQueryProperties = Type.Pick(superAdminUsersChangeStoreSchema, [
  'transferredStoreId',
  'storeId',
  'orderId',
  'cancelReason',
  'comment',
  'transferType',
  'selectedProducts'
])
export const superAdminUsersChangeStoreQuerySchema = Type.Intersect(
  [
    querySyntax(superAdminUsersChangeStoreQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type SuperAdminUsersChangeStoreQuery = Static<typeof superAdminUsersChangeStoreQuerySchema>
export const superAdminUsersChangeStoreQueryValidator = getValidator(
  superAdminUsersChangeStoreQuerySchema,
  queryValidator
)
export const superAdminUsersChangeStoreQueryResolver = resolve<
  SuperAdminUsersChangeStoreQuery,
  HookContext<SuperAdminUsersChangeStoreService>
>({})
