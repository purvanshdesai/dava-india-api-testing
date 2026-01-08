// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { PatientsService } from './patients.class'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'
import { ModelObjectId } from '../../utils'

export const CONSTANTS = {
  GENDER: {
    MALE: 'male',
    FEMALE: 'female',
    OTHERS: 'others'
  }
}
// Main data model schema
export const patientsSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    name: Type.String(),
    dateOfBirth: Type.Optional(Type.Union([Type.String({ format: 'date-time' }), Type.Null()])),
    phoneNumber: Type.Optional(Type.String()),
    gender: Type.Optional(
      StringEnum([CONSTANTS.GENDER.MALE, CONSTANTS.GENDER.FEMALE, CONSTANTS.GENDER.OTHERS])
    ),
    relation: Type.Optional(Type.String()),
    email: Type.Optional(Type.String({ format: 'email', mongoose: { lowercase: true, trim: true } })),
    userId: Type.Optional(ModelObjectId({ mongoose: { ref: 'users' } })),
    deleted: Type.Optional(Type.Boolean())
  },
  { $id: 'Patients', additionalProperties: false }
)
export type Patients = Static<typeof patientsSchema>
export const patientsValidator = getValidator(patientsSchema, dataValidator)
export const patientsResolver = resolve<Patients, HookContext<PatientsService>>({})

export const patientsExternalResolver = resolve<Patients, HookContext<PatientsService>>({})

// Schema for creating new entries
export const patientsDataSchema = Type.Pick(
  patientsSchema,
  ['name', 'dateOfBirth', 'phoneNumber', 'gender', 'relation', 'email', 'userId', 'deleted'],
  {
    $id: 'PatientsData'
  }
)
export type PatientsData = Static<typeof patientsDataSchema>
export const patientsDataValidator = getValidator(patientsDataSchema, dataValidator)
export const patientsDataResolver = resolve<Patients, HookContext<PatientsService>>({})

// Schema for updating existing entries
export const patientsPatchSchema = Type.Partial(patientsSchema, {
  $id: 'PatientsPatch'
})
export type PatientsPatch = Static<typeof patientsPatchSchema>
export const patientsPatchValidator = getValidator(patientsPatchSchema, dataValidator)
export const patientsPatchResolver = resolve<Patients, HookContext<PatientsService>>({})

// Schema for allowed query properties
export const patientsQueryProperties = Type.Pick(patientsSchema, [
  '_id',
  'name',
  'dateOfBirth',
  'phoneNumber',
  'gender',
  'relation',
  'email',
  'userId',
  'deleted'
])
export const patientsQuerySchema = Type.Intersect(
  [
    querySyntax(patientsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type PatientsQuery = Static<typeof patientsQuerySchema>
export const patientsQueryValidator = getValidator(patientsQuerySchema, queryValidator)
export const patientsQueryResolver = resolve<PatientsQuery, HookContext<PatientsService>>({})

// Mongoose model
export const patientsDb = Type.Pick(
  patientsSchema,
  ['name', 'dateOfBirth', 'phoneNumber', 'gender', 'relation', 'email', 'userId', 'deleted'],
  {
    $id: 'PatientsDb'
  }
)
export type patientsDbType = Static<typeof patientsDb>
const mongooseSchema = typeboxToMongooseSchema(patientsDb)
export const PatientsModel = makeMongooseModel('patients', mongooseSchema)
