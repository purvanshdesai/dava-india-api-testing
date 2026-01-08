// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { ConsultancyAppointmentSlotsService } from './consultancy-appointment-slots.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const consultancyAppointmentSlotsSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    date: Type.Optional(Type.String({ format: 'date-time' })),
    startTime: Type.Optional(Type.String()),
    endTime: Type.Optional(Type.String()),
    maxAppointments: Type.Optional(Type.Number()),
    appointments: Type.Optional(Type.Array(ModelObjectId({ mongoose: { ref: 'consultations' } }))),
    availableCount: Type.Optional(Type.Number())
  },
  { $id: 'ConsultancyAppointmentSlots', additionalProperties: false }
)
export type ConsultancyAppointmentSlots = Static<typeof consultancyAppointmentSlotsSchema>
export const consultancyAppointmentSlotsValidator = getValidator(
  consultancyAppointmentSlotsSchema,
  dataValidator
)
export const consultancyAppointmentSlotsResolver = resolve<
  ConsultancyAppointmentSlots,
  HookContext<ConsultancyAppointmentSlotsService>
>({})

export const consultancyAppointmentSlotsExternalResolver = resolve<
  ConsultancyAppointmentSlots,
  HookContext<ConsultancyAppointmentSlotsService>
>({})

// Schema for creating new entries
export const consultancyAppointmentSlotsDataSchema = Type.Pick(
  consultancyAppointmentSlotsSchema,
  ['date', 'startTime', 'endTime', 'maxAppointments', 'appointments', 'availableCount'],
  {
    $id: 'ConsultancyAppointmentSlotsData'
  }
)
export type ConsultancyAppointmentSlotsData = Static<typeof consultancyAppointmentSlotsDataSchema>
export const consultancyAppointmentSlotsDataValidator = getValidator(
  consultancyAppointmentSlotsDataSchema,
  dataValidator
)
export const consultancyAppointmentSlotsDataResolver = resolve<
  ConsultancyAppointmentSlots,
  HookContext<ConsultancyAppointmentSlotsService>
>({})

// Schema for updating existing entries
export const consultancyAppointmentSlotsPatchSchema = Type.Partial(consultancyAppointmentSlotsSchema, {
  $id: 'ConsultancyAppointmentSlotsPatch'
})
export type ConsultancyAppointmentSlotsPatch = Static<typeof consultancyAppointmentSlotsPatchSchema>
export const consultancyAppointmentSlotsPatchValidator = getValidator(
  consultancyAppointmentSlotsPatchSchema,
  dataValidator
)
export const consultancyAppointmentSlotsPatchResolver = resolve<
  ConsultancyAppointmentSlots,
  HookContext<ConsultancyAppointmentSlotsService>
>({})

// Schema for allowed query properties
export const consultancyAppointmentSlotsQueryProperties = Type.Pick(consultancyAppointmentSlotsSchema, [
  '_id',
  'date',
  'startTime',
  'endTime',
  'maxAppointments',
  'appointments',
  'availableCount'
])
export const consultancyAppointmentSlotsQuerySchema = Type.Intersect(
  [
    querySyntax(consultancyAppointmentSlotsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type ConsultancyAppointmentSlotsQuery = Static<typeof consultancyAppointmentSlotsQuerySchema>
export const consultancyAppointmentSlotsQueryValidator = getValidator(
  consultancyAppointmentSlotsQuerySchema,
  queryValidator
)
export const consultancyAppointmentSlotsQueryResolver = resolve<
  ConsultancyAppointmentSlotsQuery,
  HookContext<ConsultancyAppointmentSlotsService>
>({})

export const ConsultancyAppointmentSlotsDb = Type.Omit(consultancyAppointmentSlotsSchema, ['_id'], {
  $id: 'ConsultancyAppointmentSlotsDb'
})

const mongooseSchema = typeboxToMongooseSchema(ConsultancyAppointmentSlotsDb)
export const ConsultationAppointmentSlotsModel = makeMongooseModel(
  'consultations-appointment-slots',
  mongooseSchema
)
