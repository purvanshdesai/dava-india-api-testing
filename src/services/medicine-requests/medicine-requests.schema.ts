// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { MedicineRequestsService } from './medicine-requests.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const medicineRequestsSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    medicineName: Type.String(),
    files: Type.Optional(Type.Array(Type.String())),
    requestNo: Type.Optional(Type.String()),
    requestedDate: Type.String({ format: 'date-time' }),
    requestedUserId: Type.Optional(ModelObjectId({ mongoose: { ref: 'users' } })),
    status: Type.Optional(StringEnum(['open', 'closed'])),
    notes: Type.Optional(Type.String())
  },
  { $id: 'MedicineRequests', additionalProperties: false }
)
export type MedicineRequests = Static<typeof medicineRequestsSchema>
export const medicineRequestsValidator = getValidator(medicineRequestsSchema, dataValidator)
export const medicineRequestsResolver = resolve<MedicineRequests, HookContext<MedicineRequestsService>>({})

export const medicineRequestsExternalResolver = resolve<
  MedicineRequests,
  HookContext<MedicineRequestsService>
>({})

// Schema for creating new entries
export const medicineRequestsDataSchema = Type.Pick(
  medicineRequestsSchema,
  ['medicineName', 'files', 'requestNo', 'requestedDate', 'requestedUserId', 'status', 'notes'],
  {
    $id: 'MedicineRequestsData'
  }
)
export type MedicineRequestsData = Static<typeof medicineRequestsDataSchema>
export const medicineRequestsDataValidator = getValidator(medicineRequestsDataSchema, dataValidator)
export const medicineRequestsDataResolver = resolve<MedicineRequests, HookContext<MedicineRequestsService>>(
  {}
)

// Schema for updating existing entries
export const medicineRequestsPatchSchema = Type.Partial(medicineRequestsSchema, {
  $id: 'MedicineRequestsPatch'
})
export type MedicineRequestsPatch = Static<typeof medicineRequestsPatchSchema>
export const medicineRequestsPatchValidator = getValidator(medicineRequestsPatchSchema, dataValidator)
export const medicineRequestsPatchResolver = resolve<MedicineRequests, HookContext<MedicineRequestsService>>(
  {}
)

// Schema for allowed query properties
export const medicineRequestsQueryProperties = Type.Pick(medicineRequestsSchema, [
  '_id',
  'medicineName',
  'files',
  'requestNo',
  'requestedDate',
  'requestedUserId',
  'status',
  'notes'
])
export const medicineRequestsQuerySchema = Type.Intersect(
  [
    querySyntax(medicineRequestsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type MedicineRequestsQuery = Static<typeof medicineRequestsQuerySchema>
export const medicineRequestsQueryValidator = getValidator(medicineRequestsQuerySchema, queryValidator)
export const medicineRequestsQueryResolver = resolve<
  MedicineRequestsQuery,
  HookContext<MedicineRequestsService>
>({})

// Mongoose model
export const medicineRequestsDb = Type.Pick(
  medicineRequestsSchema,
  ['medicineName', 'files', 'requestNo', 'requestedDate', 'requestedUserId', 'status', 'notes'],
  {
    $id: 'medicineRequestsDb'
  }
)
export type medicineRequestsDbType = Static<typeof medicineRequestsDb>
const mongooseSchema = typeboxToMongooseSchema(medicineRequestsDb)
export const MedicineRequestsModel = makeMongooseModel('medicine-requests', mongooseSchema)
