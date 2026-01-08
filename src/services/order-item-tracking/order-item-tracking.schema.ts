// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { OrderItemTrackingService } from './order-item-tracking.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

export const CONSTANTS = {
  TRACKING_TYPE: {
    ORDER: 'order',
    CANCEL: 'cancel',
    PARTIAL_CANCEL: 'partial-cancel',
    RETURN: 'return',
    PARTIAL_RETURN: 'partial-return'
  }
}
// Main data model schema
export const orderItemTrackingSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    type: StringEnum(Object.values(CONSTANTS.TRACKING_TYPE)),
    items: Type.Array(ModelObjectId({ mongoose: { ref: 'order-items' } })),
    store: ModelObjectId({ mongoose: { ref: 'stores' } }),
    order: ModelObjectId({ mongoose: { ref: 'orders' } }),
    status: StringEnum(['pending', 'dispatched', 'delivered']),
    timeline: Type.Array(Type.Any()),
    lastTimelineStatus: Type.Optional(Type.String()),
    weight: Type.Optional(Type.Number()), // weight in kg
    volume: Type.Optional(
      Type.Object({
        // dimensions in cm
        length: Type.Number(),
        width: Type.Number(),
        breadth: Type.Number()
      })
    ),
    logisticsOrderId: Type.Optional(Type.String()),
    shipmentId: Type.Optional(Type.String()),
    awbNo: Type.Optional(Type.String()),
    shipmentCreatedAt: Type.Optional(Type.String({ format: 'date-time' })),
    pickupScheduledAt: Type.Optional(Type.Union([Type.String({ format: 'date-time' }), Type.Null()])),
    logisticPartnerCourierId: Type.Optional(Type.String()),
    logisticPartnerCourierName: Type.Optional(Type.String()),
    cost: Type.Optional(Type.Number()),
    pickupDetails: Type.Optional(Type.Record(Type.String(), Type.Any())),
    packageSize: Type.Optional(StringEnum(['small', 'big'])),
    manifestUrl: Type.Optional(Type.String()),
    labelUrl: Type.Optional(Type.String()),
    invoiceUrl: Type.Optional(Type.String()),
    etd: Type.Optional(Type.String({ format: 'date-time' })),
    orderLogistics: Type.Optional(Type.Record(Type.String(), Type.Any())),
    invoiceNo: Type.Optional(Type.String()),
    deliveryMode: Type.Optional(Type.String()),
    hasPrescriptionVerification: Type.Optional(Type.Boolean()),
    parentOrderTracking: Type.Optional(ModelObjectId({ mongoose: { ref: 'order-item-tracking' } })),
    isDeleted: Type.Optional(Type.Boolean()),
    isSplitted: Type.Optional(Type.Boolean()),
    splitTrackingId: Type.Optional(Type.String())
  },
  { $id: 'OrderItemTracking', additionalProperties: false }
)
export type OrderItemTracking = Static<typeof orderItemTrackingSchema>
export const orderItemTrackingValidator = getValidator(orderItemTrackingSchema, dataValidator)
export const orderItemTrackingResolver = resolve<OrderItemTracking, HookContext<OrderItemTrackingService>>({})

export const orderItemTrackingExternalResolver = resolve<
  OrderItemTracking,
  HookContext<OrderItemTrackingService>
>({})

// Schema for creating new entries
export const orderItemTrackingDataSchema = Type.Pick(orderItemTrackingSchema, [], {
  $id: 'OrderItemTrackingData'
})
export type OrderItemTrackingData = Static<typeof orderItemTrackingDataSchema>
export const orderItemTrackingDataValidator = getValidator(orderItemTrackingDataSchema, dataValidator)
export const orderItemTrackingDataResolver = resolve<
  OrderItemTracking,
  HookContext<OrderItemTrackingService>
>({})

// Schema for updating existing entries
export const orderItemTrackingPatchSchema = Type.Partial(orderItemTrackingSchema, {
  $id: 'OrderItemTrackingPatch'
})
export type OrderItemTrackingPatch = Static<typeof orderItemTrackingPatchSchema>
export const orderItemTrackingPatchValidator = getValidator(orderItemTrackingPatchSchema, dataValidator)
export const orderItemTrackingPatchResolver = resolve<
  OrderItemTracking,
  HookContext<OrderItemTrackingService>
>({})

// Schema for allowed query properties
export const orderItemTrackingQueryProperties = Type.Pick(orderItemTrackingSchema, [])
export const orderItemTrackingQuerySchema = Type.Intersect(
  [
    querySyntax(orderItemTrackingQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type OrderItemTrackingQuery = Static<typeof orderItemTrackingQuerySchema>
export const orderItemTrackingQueryValidator = getValidator(orderItemTrackingQuerySchema, queryValidator)
export const orderItemTrackingQueryResolver = resolve<
  OrderItemTrackingQuery,
  HookContext<OrderItemTrackingService>
>({})

export const orderItemsTrackingDb = Type.Omit(orderItemTrackingSchema, ['_id'])

const mongooseSchema = typeboxToMongooseSchema(orderItemsTrackingDb)
export const OrderItemTrackingModal = makeMongooseModel('order-item-tracking', mongooseSchema)
