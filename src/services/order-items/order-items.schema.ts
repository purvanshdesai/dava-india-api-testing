// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { OrderItemsService } from './order-items.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const orderItemsSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    order: ModelObjectId({ mongoose: { ref: 'orders' } }),
    product: ModelObjectId({ mongoose: { ref: 'products' } }),
    quantity: Type.Number(),
    amount: Type.Number(),
    discountAmount: Type.Optional(Type.Number()),
    davaCoinsUsed: Type.Optional(Type.Number()),
    currency: Type.String(),
    orderTracking: Type.Optional(ModelObjectId({ mongoose: { ref: 'order-item-tracking' } })),
    user: ModelObjectId({ mongoose: { ref: 'users' } }),
    batchNo: Type.Optional(Type.String()),
    gstDetails: Type.Optional(Type.Any()),
    status: Type.Optional(Type.String()),
    isCancelRequested: Type.Optional(Type.Boolean()),
    isPartialCancelRequested: Type.Optional(Type.Boolean()),
    isPartialReturnRequested: Type.Optional(Type.Boolean()),
    partialCancelRequestStatus: Type.Optional(StringEnum(['pending', 'approved', 'rejected'])),
    partialReturnRequestStatus: Type.Optional(StringEnum(['pending', 'approved', 'rejected'])),
    adminComment: Type.Optional(Type.String()),
    parentOrderItemId: ModelObjectId({ mongoose: { ref: 'order-items' } }),
    isReturnRequested: Type.Optional(Type.Boolean()),
    returnDetails: Type.Optional(
      Type.Object({
        reason: Type.String(),
        comment: Type.Optional(Type.String()),
        images: Type.Optional(Type.Array(Type.Any()))
      })
    ),
    cancellationDetails: Type.Optional(
      Type.Object({
        reason: Type.String(),
        comment: Type.Optional(Type.String())
      })
    ),
    suggestedStoreId: Type.Optional(Type.String()),
    suggestedBatchNo: Type.Optional(Type.String()),
    isPrescriptionRequired: Type.Optional(Type.Boolean()),
    parentOrderItem: Type.Optional(ModelObjectId({ mongoose: { ref: 'order-items' } })),
    isReturnQtyModified: Type.Optional(Type.Boolean())
  },
  { $id: 'OrderItems', additionalProperties: false }
)
export type OrderItems = Static<typeof orderItemsSchema>
export const orderItemsValidator = getValidator(orderItemsSchema, dataValidator)
export const orderItemsResolver = resolve<OrderItems, HookContext<OrderItemsService>>({})

export const orderItemsExternalResolver = resolve<OrderItems, HookContext<OrderItemsService>>({})

// Schema for creating new entries
export const orderItemsDataSchema = Type.Pick(orderItemsSchema, [], {
  $id: 'OrderItemsData'
})
export type OrderItemsData = Static<typeof orderItemsDataSchema>
export const orderItemsDataValidator = getValidator(orderItemsDataSchema, dataValidator)
export const orderItemsDataResolver = resolve<OrderItems, HookContext<OrderItemsService>>({})

// Schema for updating existing entries
export const orderItemsPatchSchema = Type.Partial(orderItemsSchema, {
  $id: 'OrderItemsPatch'
})
export type OrderItemsPatch = Static<typeof orderItemsPatchSchema>
export const orderItemsPatchValidator = getValidator(orderItemsPatchSchema, dataValidator)
export const orderItemsPatchResolver = resolve<OrderItems, HookContext<OrderItemsService>>({})

// Schema for allowed query properties
export const orderItemsQueryProperties = Type.Pick(orderItemsSchema, [])
export const orderItemsQuerySchema = Type.Intersect(
  [
    querySyntax(orderItemsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type OrderItemsQuery = Static<typeof orderItemsQuerySchema>
export const orderItemsQueryValidator = getValidator(orderItemsQuerySchema, queryValidator)
export const orderItemsQueryResolver = resolve<OrderItemsQuery, HookContext<OrderItemsService>>({})

export const orderItemsDb = Type.Omit(orderItemsSchema, ['_id'])

const mongooseSchema = typeboxToMongooseSchema(orderItemsDb)
export const OrderItemModel = makeMongooseModel('order-items', mongooseSchema)
