// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../../declarations'
import { dataValidator, queryValidator } from '../../../validators'
import type { StoreAdminUsersChangeStoreService } from './change-store.class'

// Main data model schema
export const storeAdminUsersChangeStoreSchema = Type.Object(
  {
    storeId: Type.String(),
    currentStoreId: Type.String(),
    orderId: Type.String(),
    cancelReason: Type.String(),
    comment: Type.String(),
    transferredStoreId: Type.String(),
    transferType: Type.Optional(Type.String()),
    selectedProducts: Type.Optional(Type.Array(Type.Any()))
  },
  { $id: 'StoreAdminUsersChangeStore', additionalProperties: false }
)
export type StoreAdminUsersChangeStore = Static<typeof storeAdminUsersChangeStoreSchema>
export const storeAdminUsersChangeStoreValidator = getValidator(
  storeAdminUsersChangeStoreSchema,
  dataValidator
)
export const storeAdminUsersChangeStoreResolver = resolve<
  StoreAdminUsersChangeStore,
  HookContext<StoreAdminUsersChangeStoreService>
>({})

export const storeAdminUsersChangeStoreExternalResolver = resolve<
  StoreAdminUsersChangeStore,
  HookContext<StoreAdminUsersChangeStoreService>
>({})

// Schema for creating new entries
export const storeAdminUsersChangeStoreDataSchema = Type.Pick(
  storeAdminUsersChangeStoreSchema,
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
    $id: 'StoreAdminUsersChangeStoreData'
  }
)
export type StoreAdminUsersChangeStoreData = Static<typeof storeAdminUsersChangeStoreDataSchema>
export const storeAdminUsersChangeStoreDataValidator = getValidator(
  storeAdminUsersChangeStoreDataSchema,
  dataValidator
)
export const storeAdminUsersChangeStoreDataResolver = resolve<
  StoreAdminUsersChangeStore,
  HookContext<StoreAdminUsersChangeStoreService>
>({})

// Schema for updating existing entries
export const storeAdminUsersChangeStorePatchSchema = Type.Partial(storeAdminUsersChangeStoreSchema, {
  $id: 'StoreAdminUsersChangeStorePatch'
})
export type StoreAdminUsersChangeStorePatch = Static<typeof storeAdminUsersChangeStorePatchSchema>
export const storeAdminUsersChangeStorePatchValidator = getValidator(
  storeAdminUsersChangeStorePatchSchema,
  dataValidator
)
export const storeAdminUsersChangeStorePatchResolver = resolve<
  StoreAdminUsersChangeStore,
  HookContext<StoreAdminUsersChangeStoreService>
>({})

// Schema for allowed query properties
export const storeAdminUsersChangeStoreQueryProperties = Type.Pick(storeAdminUsersChangeStoreSchema, [
  'storeId',
  'transferredStoreId',
  'orderId',
  'cancelReason',
  'comment',
  'transferType',
  'selectedProducts'
])
export const storeAdminUsersChangeStoreQuerySchema = Type.Intersect(
  [
    querySyntax(storeAdminUsersChangeStoreQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type StoreAdminUsersChangeStoreQuery = Static<typeof storeAdminUsersChangeStoreQuerySchema>
export const storeAdminUsersChangeStoreQueryValidator = getValidator(
  storeAdminUsersChangeStoreQuerySchema,
  queryValidator
)
export const storeAdminUsersChangeStoreQueryResolver = resolve<
  StoreAdminUsersChangeStoreQuery,
  HookContext<StoreAdminUsersChangeStoreService>
>({})
