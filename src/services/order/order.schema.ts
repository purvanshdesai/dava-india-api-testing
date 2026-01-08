// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { OrderConsultationService, OrderService } from './order.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'
import { InferRawDocType } from 'mongoose'
import { PAYMENT_GATEWAYS } from '../../payments'

export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PAYMENT_CANCELED_BY_USER: 'payment-cancelled-by-user',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  REFUND_INITIATED: 'refund-initiated'
}

export const PAYMENT_STATUS = {
  CAPTURED: 'captured',
  USER_CANCELLED: 'userCancelled'
}

// Main data model schema
const itemSchema = Type.Object({
  productId: ModelObjectId({ mongoose: { ref: 'products' } }),
  quantity: Type.Number(),
  amount: Type.Number(),
  total: Type.Number(),
  discountedAmount: Type.Optional(Type.Number()),
  couponCode: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  offerId: Type.Optional(ModelObjectId({ mongoose: { ref: 'users' } })),
  davaCoinsUsed: Type.Optional(Type.Number())
})

export const orderSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    userId: ModelObjectId({
      mongoose: {
        ref: 'users'
      }
    }),
    orderType: StringEnum(['general', 'buy-now', 'consultation', 'items-without-prescription']),
    consultationId: Type.Optional(Type.String()),
    consultationNote: Type.Optional(Type.String()),
    prescription: Type.Optional(
      Type.Object({
        urls: Type.Optional(Type.Array(Type.String())),
        consultationId: Type.Optional(ModelObjectId({ mongoose: { ref: 'consultations' } })),
        ticketId: Type.Optional(ModelObjectId({ mongoose: { ref: 'tickets' } })),
        expiryDate: Type.Optional(Type.String({ format: 'date-time' }))
      })
    ),
    paymentOrderId: Type.Optional(Type.String()),
    status: StringEnum(Object.values(ORDER_STATUS)),
    orderTotal: Type.Number(),
    subTotal: Type.Number(),
    currency: Type.String(),
    addressId: ModelObjectId({ mongoose: { ref: 'user-addresses' } }),
    couponCode: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    offerId: Type.Union([ModelObjectId({ mongoose: { ref: 'categories' } }), Type.Null()]),
    discountedAmount: Type.Optional(Type.Number()),
    deliveryCharge: Type.Optional(Type.Number()),
    paymentAmount: Type.Number(),
    taxAmount: Type.Optional(Type.Number()),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' })),
    items: Type.Optional(Type.Array(itemSchema)),
    paymentMode: StringEnum([PAYMENT_GATEWAYS.RAZORPAY, PAYMENT_GATEWAYS.PAYU]),
    hasPrescription: Type.Optional(Type.Boolean()),
    userSocketId: Type.String(),
    orderId: Type.String(),
    invoice: Type.Optional(Type.String()),
    address: Type.Any(),
    'userId.name': Type.String(),
    'userId.email': Type.String(),
    'userId.phoneNumber': Type.String(),
    consultDoctorForPrescription: Type.Optional(Type.Boolean()),
    handlingCharge: Type.Number(),
    packingCharge: Type.Number(),
    platformFee: Type.Number(),
    deliveryMode: Type.Union([Type.String(), Type.Object({}), Type.Array(Type.String())]),
    patientId: Type.Optional(ModelObjectId({ mongoose: { ref: 'patients' } })),
    isSessionFailedOrder: Type.Optional(Type.Boolean()),
    hasMembershipFreeDeliveryBenefit: Type.Optional(Type.Boolean()),
    deviceType: Type.Optional(StringEnum(['web', 'mobile-web', 'android', 'ios'])),
    dateOfConsult: Type.Optional(Type.Union([Type.String({ format: 'date-time' }), Type.Null()])),
    timeOfConsult: Type.Optional(Type.String()),
    phoneNumber: Type.Optional(Type.String()),
    isDavaCoinsApplied: Type.Optional(Type.Boolean()),
    davaCoinsUsed: Type.Optional(Type.Number()),
    davaCoinsCreditedForMembership: Type.Optional(Type.Number()),
    davaOneMembershipAmount: Type.Optional(Type.Number()),
    isDavaOneMembershipAdded: Type.Optional(Type.Boolean()),
    utmParams: Type.Optional(Type.Any()),
    skipLogistics: Type.Optional(Type.Boolean()),
    skipRefund: Type.Optional(Type.Boolean()),
    page: Type.Optional(Type.Any()),
    limit: Type.Optional(Type.Any())
  },
  { $id: 'Order', additionalProperties: false }
)
export type Order = Static<typeof orderSchema>
export const orderValidator = getValidator(orderSchema, dataValidator)
export const orderResolver = resolve<Order, HookContext<OrderService>>({})
export const orderConsultationResolver = resolve<Order, HookContext<OrderConsultationService>>({})

export const orderExternalResolver = resolve<Order, HookContext<OrderService>>({})
export const orderConsultationExternalResolver = resolve<Order, HookContext<OrderConsultationService>>({})

// Schema for creating new entries
export const orderDataSchema = Type.Pick(
  orderSchema,
  [
    'orderTotal',
    'subTotal',
    'currency',
    'addressId',
    'couponCode',
    'discountedAmount',
    'deliveryCharge',
    'taxAmount',
    'paymentAmount',
    'paymentMode',
    'userSocketId',
    'items',
    'address',
    'createdAt',
    'updatedAt',
    'prescription',
    'hasPrescription',
    'orderType',
    'consultationId',
    'consultDoctorForPrescription',
    'patientId',
    'isSessionFailedOrder',
    'deviceType',
    'dateOfConsult',
    'timeOfConsult',
    'phoneNumber',
    'isDavaCoinsApplied',
    'davaCoinsUsed',
    'davaCoinsCreditedForMembership',
    'davaOneMembershipAmount',
    'isDavaOneMembershipAdded',
    'utmParams',
    'skipLogistics',
    'skipRefund',
    'page',
    'limit'
  ],
  {
    $id: 'OrderData'
  }
)
export type OrderData = Static<typeof orderDataSchema>
export const orderDataValidator = getValidator(orderDataSchema, dataValidator)
export const orderDataResolver = resolve<Order, HookContext<OrderService>>({})

// Schema for updating existing entries
export const orderPatchSchema = Type.Partial(orderSchema, {
  $id: 'OrderPatch'
})
export type OrderPatch = Static<typeof orderPatchSchema>
export const orderPatchValidator = getValidator(orderPatchSchema, dataValidator)
export const orderPatchResolver = resolve<Order, HookContext<OrderService>>({})

// Schema for allowed query properties
export const orderQueryProperties = Type.Pick(orderSchema, ['page', 'limit'])
export const orderQuerySchema = Type.Intersect(
  [
    querySyntax(orderQueryProperties),
    // Add additional query properties here
    Type.Object({
      dateFilter: Type.Optional(StringEnum(['7days', '15days', '30days', 'thisYear', 'lastYear']))
    }, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type OrderQuery = Static<typeof orderQuerySchema>
export const orderQueryValidator = getValidator(orderQuerySchema, queryValidator)

export const orderQueryResolver = resolve<OrderQuery, HookContext<OrderService>>({})

export const OrderDb = Type.Omit(
  orderSchema,
  ['_id', 'userSocketId', 'userId.name', 'userId.email', 'userId.phoneNumber'],
  {
    $id: 'OrderDb'
  }
)

export type TOrderDb = Static<typeof OrderDb>

const mongooseSchema = typeboxToMongooseSchema(OrderDb)

export type TOrderDbSchema = InferRawDocType<typeof mongooseSchema>

export const OrderModel = makeMongooseModel('orders', mongooseSchema)

export const checkoutSessionSchema = Type.Object({
  _id: ObjectIdSchema(),
  orderId: ModelObjectId({ mongoose: { ref: 'orders' } }),
  userId: ModelObjectId({ mongoose: { ref: 'users' } }),
  items: Type.Array(
    Type.Object({
      productId: ModelObjectId({ mongoose: { ref: 'products' } }),
      storeId: ModelObjectId({ mongoose: { ref: 'stores' } }),
      quantity: Type.Number(),
      softHoldRelease: Type.Boolean(),
      orderHoldRelease: Type.Boolean()
    })
  ),
  status: StringEnum(['active', 'inactive']),
  sessionStartTime: Type.String({ format: 'date-time' }),
  sessionEndTime: Type.String({ format: 'date-time' }),
  createdAt: Type.String({ format: 'date-time' })
})
export const checkoutSessionDBSchema = Type.Pick(checkoutSessionSchema, [
  'orderId',
  'items',
  'status',
  'sessionStartTime',
  'sessionEndTime',
  'createdAt'
])
const checkoutSessionMongooseSchema = typeboxToMongooseSchema(checkoutSessionDBSchema)
export const CheckoutSessionModel = makeMongooseModel('checkout-sessions', checkoutSessionMongooseSchema)
