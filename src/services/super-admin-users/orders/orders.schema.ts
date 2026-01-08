// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../../declarations'
import { dataValidator, queryValidator } from '../../../validators'
import type { SuperAdminOrdersService } from './orders.class'
import { orderSchema } from '../../order/order.schema'
import { UsersModel } from '../../users/users.schema'

// Main data model schema
export const superAdminOrdersSchema = orderSchema
export type SuperAdminOrders = Static<typeof superAdminOrdersSchema>
// export const superAdminOrdersValidator = getValidator(orderSchema, dataValidator)
export const superAdminOrdersResolver = resolve<SuperAdminOrders, HookContext<SuperAdminOrdersService>>({
  userId: async (value, _message, context) => {
    return await UsersModel.findById(value).lean()
  }
})

export const superAdminOrdersExternalResolver = resolve<
  SuperAdminOrders,
  HookContext<SuperAdminOrdersService>
>({})

// Schema for creating new entries
export const superAdminOrdersDataSchema = Type.Pick(superAdminOrdersSchema, [], {
  $id: 'SuperAdminOrdersData'
})
export type SuperAdminOrdersData = Static<typeof superAdminOrdersDataSchema>
export const superAdminOrdersDataValidator = getValidator(superAdminOrdersDataSchema, dataValidator)
export const superAdminOrdersDataResolver = resolve<SuperAdminOrders, HookContext<SuperAdminOrdersService>>(
  {}
)

// Schema for updating existing entries
export const superAdminOrdersPatchSchema = Type.Partial(superAdminOrdersSchema, {
  $id: 'SuperAdminOrdersPatch'
})
export type SuperAdminOrdersPatch = Static<typeof superAdminOrdersPatchSchema>
export const superAdminOrdersPatchValidator = getValidator(superAdminOrdersPatchSchema, dataValidator)
export const superAdminOrdersPatchResolver = resolve<SuperAdminOrders, HookContext<SuperAdminOrdersService>>(
  {}
)

// Schema for allowed query properties
export const superAdminOrdersQueryProperties = Type.Intersect([
  Type.Pick(superAdminOrdersSchema, [
    '_id',
    'orderId',
    'status',
    'userId.name',
    'userId.email',
    'userId.phoneNumber',
    'deliveryMode'
  ]),
  Type.Object({
    'store.storeCode': Type.Optional(Type.String())
  })
])

export const superAdminOrdersQuerySchema = Type.Intersect(
  [
    querySyntax(superAdminOrdersQueryProperties, {
      _id: {
        $regex: Type.String(),
        $options: Type.String()
      },
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
      },
      'store.storeCode': {
        $regex: Type.String(),
        $options: Type.String()
      }
    }),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: true })
  ],
  { additionalProperties: true }
)
export type SuperAdminOrdersQuery = Static<typeof superAdminOrdersQuerySchema>
export const superAdminOrdersQueryValidator = getValidator(superAdminOrdersQuerySchema, queryValidator)
export const superAdminOrdersQueryResolver = resolve<
  SuperAdminOrdersQuery,
  HookContext<SuperAdminOrdersService>
>({})
