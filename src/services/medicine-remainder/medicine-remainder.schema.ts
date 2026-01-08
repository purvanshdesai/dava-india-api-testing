// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { MedicineRemainderService } from './medicine-remainder.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const medicineRemainderSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    userId: Type.Optional(Type.String()),
    pincode: Type.String(),
    productId: Type.Optional(ModelObjectId({ mongoose: { ref: 'products' } })),
    deliveryPolicyId: Type.Optional(ModelObjectId({ mongoose: { ref: 'delivery-policies' } })),
    status: Type.Optional(Type.String()),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    notifiedAt: Type.Optional(Type.Union([Type.String({ format: 'date-time' }), Type.Null()]))
  },
  { $id: 'MedicineRemainder', additionalProperties: false }
)
export type MedicineRemainder = Static<typeof medicineRemainderSchema>
export const medicineRemainderValidator = getValidator(medicineRemainderSchema, dataValidator)
export const medicineRemainderResolver = resolve<MedicineRemainder, HookContext<MedicineRemainderService>>({})

export const medicineRemainderExternalResolver = resolve<
  MedicineRemainder,
  HookContext<MedicineRemainderService>
>({})

// Schema for creating new entries (frontend payload)
export const medicineRemainderDataSchema = Type.Object(
  {
    pincode: Type.String(),
    productId: Type.Optional(ModelObjectId({ mongoose: { ref: 'products' } }))
  },
  {
    $id: 'MedicineRemainderData'
  }
)
export type MedicineRemainderData = Static<typeof medicineRemainderDataSchema>
export const medicineRemainderDataValidator = getValidator(medicineRemainderDataSchema, dataValidator)
export const medicineRemainderDataResolver = resolve<
  MedicineRemainder,
  HookContext<MedicineRemainderService>
>({})

// Schema for updating existing entries
export const medicineRemainderPatchSchema = Type.Partial(medicineRemainderSchema, {
  $id: 'MedicineRemainderPatch'
})
export type MedicineRemainderPatch = Static<typeof medicineRemainderPatchSchema>
export const medicineRemainderPatchValidator = getValidator(medicineRemainderPatchSchema, dataValidator)
export const medicineRemainderPatchResolver = resolve<
  MedicineRemainder,
  HookContext<MedicineRemainderService>
>({})

// Schema for allowed query properties
export const medicineRemainderQueryProperties = Type.Pick(medicineRemainderSchema, [
  '_id',
  'userId',
  'pincode',
  'productId',
  'deliveryPolicyId',
  'status',
  'createdAt',
  'notifiedAt'
])
export const medicineRemainderQuerySchema = Type.Intersect(
  [
    querySyntax(medicineRemainderQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type MedicineRemainderQuery = Static<typeof medicineRemainderQuerySchema>
export const medicineRemainderQueryValidator = getValidator(medicineRemainderQuerySchema, queryValidator)
export const medicineRemainderQueryResolver = resolve<
  MedicineRemainderQuery,
  HookContext<MedicineRemainderService>
>({})

export const MedicineRemainderDb = Type.Pick(
  medicineRemainderSchema,
  ['userId', 'pincode', 'productId', 'deliveryPolicyId', 'status', 'createdAt', 'notifiedAt'],
  {
    $id: 'MedicineRemainderDb'
  }
)

// export type TCouponsDb = Static<typeof couponsDataSchema>

const mongooseSchema = typeboxToMongooseSchema(MedicineRemainderDb)
export const MedicineRemainderModel = makeMongooseModel('medicine-remainder', mongooseSchema)
