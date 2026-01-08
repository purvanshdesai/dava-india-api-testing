// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../../declarations'
import { dataValidator, queryValidator } from '../../../validators'
import type { StoreAdminUsersPrescriptionStatusService } from './prescription-status.class'

// Main data model schema
export const storeAdminUsersPrescriptionStatusSchema = Type.Object(
  {
    status: Type.String(),
    orderId: Type.String(),
    storeId: Type.String(),
    orderTrackingId: Type.String()
  },
  { $id: 'StoreAdminUsersPrescriptionStatus', additionalProperties: false }
)
export type StoreAdminUsersPrescriptionStatus = Static<typeof storeAdminUsersPrescriptionStatusSchema>
export const storeAdminUsersPrescriptionStatusValidator = getValidator(
  storeAdminUsersPrescriptionStatusSchema,
  dataValidator
)
export const storeAdminUsersPrescriptionStatusResolver = resolve<
  StoreAdminUsersPrescriptionStatus,
  HookContext<StoreAdminUsersPrescriptionStatusService>
>({})

export const storeAdminUsersPrescriptionStatusExternalResolver = resolve<
  StoreAdminUsersPrescriptionStatus,
  HookContext<StoreAdminUsersPrescriptionStatusService>
>({})

// Schema for creating new entries
export const storeAdminUsersPrescriptionStatusDataSchema = Type.Pick(
  storeAdminUsersPrescriptionStatusSchema,
  ['status', 'orderId', 'storeId', 'orderTrackingId'],
  {
    $id: 'StoreAdminUsersPrescriptionStatusData'
  }
)
export type StoreAdminUsersPrescriptionStatusData = Static<typeof storeAdminUsersPrescriptionStatusDataSchema>
export const storeAdminUsersPrescriptionStatusDataValidator = getValidator(
  storeAdminUsersPrescriptionStatusDataSchema,
  dataValidator
)
export const storeAdminUsersPrescriptionStatusDataResolver = resolve<
  StoreAdminUsersPrescriptionStatus,
  HookContext<StoreAdminUsersPrescriptionStatusService>
>({})

// Schema for updating existing entries
export const storeAdminUsersPrescriptionStatusPatchSchema = Type.Partial(
  storeAdminUsersPrescriptionStatusSchema,
  {
    $id: 'StoreAdminUsersPrescriptionStatusPatch'
  }
)
export type StoreAdminUsersPrescriptionStatusPatch = Static<
  typeof storeAdminUsersPrescriptionStatusPatchSchema
>
export const storeAdminUsersPrescriptionStatusPatchValidator = getValidator(
  storeAdminUsersPrescriptionStatusPatchSchema,
  dataValidator
)
export const storeAdminUsersPrescriptionStatusPatchResolver = resolve<
  StoreAdminUsersPrescriptionStatus,
  HookContext<StoreAdminUsersPrescriptionStatusService>
>({})

// Schema for allowed query properties
export const storeAdminUsersPrescriptionStatusQueryProperties = Type.Pick(
  storeAdminUsersPrescriptionStatusSchema,
  []
)
export const storeAdminUsersPrescriptionStatusQuerySchema = Type.Intersect(
  [
    querySyntax(storeAdminUsersPrescriptionStatusQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type StoreAdminUsersPrescriptionStatusQuery = Static<
  typeof storeAdminUsersPrescriptionStatusQuerySchema
>
export const storeAdminUsersPrescriptionStatusQueryValidator = getValidator(
  storeAdminUsersPrescriptionStatusQuerySchema,
  queryValidator
)
export const storeAdminUsersPrescriptionStatusQueryResolver = resolve<
  StoreAdminUsersPrescriptionStatusQuery,
  HookContext<StoreAdminUsersPrescriptionStatusService>
>({})
