// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { CartsService } from './carts.class'
import { ModelObjectId } from '../../utils'
import { typeboxToMongooseSchema, makeMongooseModel } from '../../utils/mongoose'

const ItemSchema = Type.Object({
  productId: ModelObjectId({ mongoose: { ref: 'products' } }),
  quantity: Type.Number({
    description: 'Quantity of the product in the cart',
    default: 1
  }),
  storeId: Type.Optional(
    Type.Union([
      ModelObjectId({
        mongoose: {
          ref: 'stores'
        }
      }),
      Type.Null()
    ])
  ),
  deliveryTime: Type.Optional(
    Type.Union([
      Type.Number({
        description: 'Optional delivery date represented as a timestamp',
        default: null
      }),
      Type.Null()
    ])
  ),
  timeDurationType: Type.Optional(
    Type.Union([
      Type.String({
        description: 'Optional delivery date represented as a timestamp',
        default: null
      }),
      Type.Null()
    ])
  ),
  isSelected: Type.Boolean({
    description: 'Indicates if the product is selected for checkout',
    default: true
  }),
  isOutOfStock: Type.Optional(
    Type.Boolean({
      description: 'Flag indicating if the product is out of stock',
      default: false
    })
  ),
  isNotDeliverable: Type.Optional(
    Type.Boolean({
      description: 'Flag indicating if the product is not deliverable to the selected address',
      default: false
    })
  ),
  taxes: Type.Optional(
    Type.Any({
      description: 'Optional tax details applicable to the product',
      default: null
    })
  ),
  taxAmount: Type.Optional(
    Type.Number({
      description: 'The calculated tax amount for the product',
      default: 0
    })
  ),
  amount: Type.Optional(Type.Number()),
  discountAmount: Type.Optional(Type.Number()),
  consultationId: Type.Optional(ModelObjectId({ mongoose: { ref: 'consultations' } })),
  isBuyNowItem: Type.Optional(Type.Boolean()),
  prescriptionReq: Type.Optional(Type.Boolean()),
  batchNo: Type.Optional(Type.String()),
  expiryDate: Type.Optional(Type.String()),
  note: Type.Optional(Type.String()),
  collections: Type.Optional(Type.Any()),
  davaCoinsUsed: Type.Optional(Type.Number())
})

export type CartItem = Static<typeof ItemSchema>

// Main data model schema
export const cartsSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    userId: ModelObjectId({ mongoose: { ref: 'users' } }),
    totalProducts: Type.Number({
      description: 'Total number of distinct products in the cart',
      default: 0
    }),
    totalQuantity: Type.Number({
      description: 'Total quantity of all products in the cart',
      default: 0
    }),
    items: Type.Array(ItemSchema, {
      description: 'Array of items in the cart'
    }),
    addressId: Type.Optional(
      Type.String({
        description: 'Optional reference to the address associated with the cart'
      })
    ),
    couponCode: Type.Optional(
      Type.String({
        description: 'Optional discount coupon code applied to the cart'
      })
    ),
    discountAmount: Type.Optional(
      Type.Union([
        Type.Number({
          description: 'Total discount amount applied to the cart',
          default: 0
        }),
        Type.Null()
      ])
    ),
    taxAmount: Type.Optional(
      Type.Union([
        Type.Number({
          description: 'Total tax amount for all items in the cart',
          default: 0
        }),
        Type.Null()
      ])
    ),
    deliveryCharges: Type.Optional(
      Type.Union([
        Type.Number({
          description: 'Delivery charges for the cart',
          default: 0
        }),
        Type.Null()
      ])
    ),
    deliveryChargeWaiver: Type.Optional(
      Type.Union([
        Type.Number({
          description: 'Waiver amount for the delivery charges',
          default: 0
        }),
        Type.Null()
      ])
    ),
    freeMinOrderValue: Type.Optional(
      Type.Union([
        Type.Number({
          description: 'Minimum order value for free delivery',
          default: 0
        }),
        Type.Null()
      ])
    ),
    zipCode: Type.Optional(
      Type.Any({
        description: 'Zip code for the delivery address associated with the cart',
        default: null
      })
    ),
    handlingChargeApplicable: Type.Boolean(),
    handlingCharge: Type.Number(),
    packagingChargeApplicable: Type.Boolean(),
    packagingCharge: Type.Number(),
    platformFeeApplicable: Type.Boolean(),
    platformFee: Type.Number(),
    deliveryMode: Type.Optional(Type.String({ default: 'standard' })),
    patientId: Type.Optional(ModelObjectId({ mongoose: { ref: 'patients' } })),
    hasMembershipFreeDeliveryBenefit: Type.Optional(Type.Boolean()),
    dateOfConsult: Type.Optional(Type.String({ format: 'date-time' })),
    timeOfConsult: Type.Optional(Type.String()),
    phoneNumber: Type.String(),
    davaCoinsUsed: Type.Optional(
      Type.Union([
        Type.Number({
          description: 'Total tax amount for all items in the cart',
          default: 0
        }),
        Type.Null()
      ])
    ),
    isDavaCoinsApplied: Type.Optional(Type.Boolean()),
    davaOneMembershipAmount: Type.Optional(Type.Number()),
    isDavaOneMembershipAdded: Type.Optional(Type.Boolean())
  },
  { $id: 'Carts', additionalProperties: true }
)
export type Carts = Static<typeof cartsSchema>
export const cartsValidator = getValidator(cartsSchema, dataValidator)
export const cartsResolver = resolve<Carts, HookContext<CartsService>>({})

export const cartsExternalResolver = resolve<Carts, HookContext<CartsService>>({})

// Schema for creating new entries
export const cartsDataSchema = Type.Pick(
  cartsSchema,
  [
    'totalProducts',
    'totalQuantity',
    'items',
    'addressId',
    'zipCode',
    'deliveryMode',
    'patientId',
    'davaOneMembershipAmount',
    'isDavaOneMembershipAdded'
  ],
  {
    $id: 'CartsData'
  }
)
export type CartsData = Static<typeof cartsDataSchema>
export const cartsDataValidator = getValidator(cartsDataSchema, dataValidator)
export const cartsDataResolver = resolve<Carts, HookContext<CartsService>>({})

// Schema for updating existing entries
export const cartsPatchSchema = Type.Partial(cartsSchema, {
  $id: 'CartsPatch'
})
export type CartsPatch = Static<typeof cartsPatchSchema>
export const cartsPatchValidator = getValidator(cartsPatchSchema, dataValidator)
export const cartsPatchResolver = resolve<Carts, HookContext<CartsService>>({})

// Schema for allowed query properties
export const cartsQueryProperties = Type.Pick(cartsSchema, [
  '_id',
  'userId',
  'totalProducts',
  'zipCode',
  'totalQuantity',
  'items'
])
export const cartsQuerySchema = Type.Intersect(
  [
    querySyntax(cartsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type CartsQuery = Static<typeof cartsQuerySchema>
export const cartsQueryValidator = getValidator(cartsQuerySchema, queryValidator)
export const cartsQueryResolver = resolve<CartsQuery, HookContext<CartsService>>({})

export const cartsDb = Type.Pick(
  cartsSchema,
  [
    'userId',
    'totalProducts',
    'totalQuantity',
    'items',
    'deliveryCharges',
    'deliveryChargeWaiver',
    'freeMinOrderValue',
    'discountAmount',
    'zipCode',
    'couponCode',
    'taxAmount',
    'zipCode',
    'handlingChargeApplicable',
    'handlingCharge',
    'packagingChargeApplicable',
    'packagingCharge',
    'platformFeeApplicable',
    'platformFee',
    'deliveryMode',
    'patientId',
    'hasMembershipFreeDeliveryBenefit',
    'dateOfConsult',
    'timeOfConsult',
    'phoneNumber',
    'isDavaCoinsApplied',
    'davaCoinsUsed',
    'isDavaOneMembershipAdded',
    'davaOneMembershipAmount'
  ],
  {
    $id: 'cartsDb'
  }
)

const mongooseSchema = typeboxToMongooseSchema(cartsDb)

export const cartModel = makeMongooseModel('carts', mongooseSchema)
