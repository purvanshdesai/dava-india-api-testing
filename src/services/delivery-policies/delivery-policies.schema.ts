// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { DeliveryPoliciesService } from './delivery-policies.class'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'
import { ModelObjectId } from '../../utils'

const deliveryModeSchema = Type.Object({
  timeDurationType: Type.String(),
  deliveryTime: Type.Number(),
  priceRange: Type.Array(
    Type.Object({
      priceFrom: Type.Number(),
      priceTo: Type.Number(),
      noLimit: Type.Boolean(),
      deliveryCharge: Type.Number()
    })
  )
})

// Main data model schema
export const deliveryPoliciesSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    zoneName: Type.String(),
    description: Type.String(),
    postalCodeType: StringEnum(['postalCode', 'postalCodeRange']),
    postalCodes: Type.Optional(Type.Array(Type.String())),
    postalCodeRanges: Type.Optional(
      Type.Object({
        from: Type.Optional(Type.Number()),
        to: Type.Optional(Type.Number())
      })
    ),
    stores: Type.Array(ModelObjectId({ mongoose: { ref: 'stores' } })),
    expectedDeliveryTime: Type.Number(),
    deliveryCharges: Type.Number(),
    freeMinOrderValue: Type.Number(),
    active: Type.Boolean(),
    // coordinates: Type.Object()
    isStandardDeliveryAvailable: Type.Boolean(),
    isOneDayDeliveryAvailable: Type.Boolean(),
    deliveryModes: Type.Object({
      standard: deliveryModeSchema,
      oneDay: deliveryModeSchema
    })
  },
  { $id: 'DeliveryPolicies', additionalProperties: false }
)
export type DeliveryPolicies = Static<typeof deliveryPoliciesSchema>
export const deliveryPoliciesValidator = getValidator(deliveryPoliciesSchema, dataValidator)
export const deliveryPoliciesResolver = resolve<DeliveryPolicies, HookContext<DeliveryPoliciesService>>({})

export const deliveryPoliciesExternalResolver = resolve<
  DeliveryPolicies,
  HookContext<DeliveryPoliciesService>
>({})

// Schema for creating new entries
export const deliveryPoliciesDataSchema = Type.Pick(
  deliveryPoliciesSchema,
  [
    'zoneName',
    'description',
    'postalCodeType',
    'postalCodes',
    'isStandardDeliveryAvailable',
    'isOneDayDeliveryAvailable',
    'deliveryModes',
    'postalCodeRanges'
  ],
  {
    $id: 'DeliveryPoliciesData'
  }
)
export type DeliveryPoliciesData = Static<typeof deliveryPoliciesDataSchema>
export const deliveryPoliciesDataValidator = getValidator(deliveryPoliciesDataSchema, dataValidator)
export const deliveryPoliciesDataResolver = resolve<DeliveryPolicies, HookContext<DeliveryPoliciesService>>(
  {}
)

// Schema for updating existing entries
export const deliveryPoliciesPatchSchema = Type.Partial(deliveryPoliciesSchema, {
  $id: 'DeliveryPoliciesPatch'
})
export type DeliveryPoliciesPatch = Static<typeof deliveryPoliciesPatchSchema>
export const deliveryPoliciesPatchValidator = getValidator(deliveryPoliciesPatchSchema, dataValidator)
export const deliveryPoliciesPatchResolver = resolve<DeliveryPolicies, HookContext<DeliveryPoliciesService>>(
  {}
)

// Schema for allowed query properties
export const deliveryPoliciesQueryProperties = Type.Pick(deliveryPoliciesSchema, [
  '_id',
  'zoneName',
  'postalCodes'
])
export const deliveryPoliciesQuerySchema = Type.Intersect(
  [
    querySyntax(deliveryPoliciesQueryProperties, {
      zoneName: {
        $regex: Type.String(),
        $options: Type.String()
      },
      postalCodes: {
        $regex: Type.String(),
        $options: Type.String()
      }
    }),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type DeliveryPoliciesQuery = Static<typeof deliveryPoliciesQuerySchema>
export const deliveryPoliciesQueryValidator = getValidator(deliveryPoliciesQuerySchema, queryValidator)
export const deliveryPoliciesQueryResolver = resolve<
  DeliveryPoliciesQuery,
  HookContext<DeliveryPoliciesService>
>({})

// Model
export const DeliveryPoliciesDb = Type.Omit(deliveryPoliciesSchema, ['_id'], {
  $id: 'DeliveryPoliciesDb'
})

const mongooseSchema = typeboxToMongooseSchema(DeliveryPoliciesDb)
export const DeliveryPoliciesModel = makeMongooseModel('delivery-policies', mongooseSchema)
