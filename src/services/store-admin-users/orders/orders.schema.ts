// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../../declarations'
import { dataValidator, queryValidator } from '../../../validators'
import type { StoreAdminUsersOrdersService } from './orders.class'

// Main data model schema
export const storeAdminUsersOrdersSchema = Type.Object(
  {
    orderId: Type.String(),
    status: Type.String(),
    'userId.name': Type.String(),
    'userId.email': Type.String(),
    _id: Type.String(),
    'userId.phoneNumber': Type.String(),
    deliveryMode: Type.Optional(Type.String())
  },
  { $id: 'StoreAdminUsersOrders', additionalProperties: false }
)
export type StoreAdminUsersOrders = Static<typeof storeAdminUsersOrdersSchema>
export const storeAdminUsersOrdersValidator = getValidator(storeAdminUsersOrdersSchema, dataValidator)
export const storeAdminUsersOrdersResolver = resolve<
  StoreAdminUsersOrders,
  HookContext<StoreAdminUsersOrdersService>
>({})

export const storeAdminUsersOrdersExternalResolver = resolve<
  StoreAdminUsersOrders,
  HookContext<StoreAdminUsersOrdersService>
>({})

// Schema for creating new entries
export const storeAdminUsersOrdersDataSchema = Type.Pick(storeAdminUsersOrdersSchema, [], {
  $id: 'StoreAdminUsersOrdersData'
})
export type StoreAdminUsersOrdersData = Static<typeof storeAdminUsersOrdersDataSchema>
export const storeAdminUsersOrdersDataValidator = getValidator(storeAdminUsersOrdersDataSchema, dataValidator)
export const storeAdminUsersOrdersDataResolver = resolve<
  StoreAdminUsersOrders,
  HookContext<StoreAdminUsersOrdersService>
>({})

// Schema for updating existing entries
export const storeAdminUsersOrdersPatchSchema = Type.Partial(storeAdminUsersOrdersSchema, {
  $id: 'StoreAdminUsersOrdersPatch'
})
export type StoreAdminUsersOrdersPatch = Static<typeof storeAdminUsersOrdersPatchSchema>
export const storeAdminUsersOrdersPatchValidator = getValidator(
  storeAdminUsersOrdersPatchSchema,
  dataValidator
)
export const storeAdminUsersOrdersPatchResolver = resolve<
  StoreAdminUsersOrders,
  HookContext<StoreAdminUsersOrdersService>
>({})

// Schema for allowed query properties
export const storeAdminUsersOrdersQueryProperties = Type.Pick(storeAdminUsersOrdersSchema, [
  'orderId',
  'status',
  'userId.name',
  'userId.email',
  '_id',
  'userId.phoneNumber',
  'deliveryMode'
])
export const storeAdminUsersOrdersQuerySchema = Type.Intersect(
  [
    querySyntax(storeAdminUsersOrdersQueryProperties, {
      orderId: {
        $regex: Type.String(),
        $options: Type.String()
      },
      'userId.email': {
        $regex: Type.String(),
        $options: Type.String()
      },
      'userId.name': {
        $regex: Type.String(),
        $options: Type.String()
      },
      'userId.phoneNumber': {
        $regex: Type.String(),
        $options: Type.String()
      }
    }),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type StoreAdminUsersOrdersQuery = Static<typeof storeAdminUsersOrdersQuerySchema>
export const storeAdminUsersOrdersQueryValidator = getValidator(
  storeAdminUsersOrdersQuerySchema,
  queryValidator
)
export const storeAdminUsersOrdersQueryResolver = resolve<
  StoreAdminUsersOrdersQuery,
  HookContext<StoreAdminUsersOrdersService>
>({})
