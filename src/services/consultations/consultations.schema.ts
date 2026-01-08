// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { ConsultationsService } from './consultations.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const consultationsSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    appointmentId: Type.String(),
    ticketType: StringEnum(['doctorConsultation', 'uploadPrescription']),
    status: StringEnum([
      'prescription_under_review',
      'prescription_declined',
      'doctor_will_call',
      'ready_for_order'
    ]),
    ticket: ModelObjectId({ mongoose: { ref: 'tickets' } }),
    prescriptionUrl: Type.Any(),
    userId: ModelObjectId({
      mongoose: {
        ref: 'users'
      }
    }),
    consultDate: Type.String({ format: 'date-time' }),
    type: StringEnum(['online']),
    chiefComplains: Type.Array(
      Type.Object({
        concern: Type.String(),
        duration: Type.String(),
        severity: Type.String()
      })
    ),
    vitals: Type.Object({
      height: Type.Number(),
      weight: Type.Number(),
      bloodPressure: Type.Union([Type.String(), Type.Number()]),
      temperature: Type.Number()
    }),
    provisionalDiagnosis: Type.Array(
      Type.Object({
        concern: Type.String(),
        duration: Type.String(),
        severity: Type.String()
      })
    ),
    medicines: Type.Array(
      Type.Object({
        productId: ModelObjectId({ mongoose: { ref: 'products' } }),
        quantity: Type.Number(),
        note: Type.String(),
        dosage: Type.Object({
          timesPerDay: Type.Number(),
          noOfDays: Type.Number(),
          beforeFood: Type.Boolean(),
          afterFood: Type.Boolean(),
          morning: Type.Boolean(),
          afternoon: Type.Boolean(),
          night: Type.Boolean(),
          sos: Type.Optional(Type.Boolean())
        })
      })
    ),
    note: Type.String(),
    prescriptionExpiryDate: Type.String({ format: 'date-time' }),
    orderId: Type.Optional(ModelObjectId({ mongoose: { ref: 'orders' } })),
    items: Type.Optional(Type.Any()),
    totalPrice: Type.Optional(Type.Number()),
    address: Type.Any(),
    orderPlaced: Type.Optional(Type.Boolean()),
    createdAt: Type.String({ format: 'date-time' }),
    phoneNumber: Type.Optional(Type.String()),
    patientId: Type.Optional(ModelObjectId({ mongoose: { ref: 'patients' } })),
    dateOfConsult: Type.Optional(Type.String({ format: 'date-time' })),
    timeOfConsult: Type.Optional(Type.String())
  },
  { $id: 'Consultations', additionalProperties: false }
)
export type Consultations = Static<typeof consultationsSchema>
export const consultationsValidator = getValidator(consultationsSchema, dataValidator)
export const consultationsResolver = resolve<Consultations, HookContext<ConsultationsService>>({})

export const consultationsExternalResolver = resolve<Consultations, HookContext<ConsultationsService>>({})

// Schema for creating new entries
export const consultationsDataSchema = Type.Pick(
  consultationsSchema,
  [
    'chiefComplains',
    'vitals',
    'provisionalDiagnosis',
    'medicines',
    'note',
    'ticket',
    'prescriptionExpiryDate',
    'phoneNumber',
    'patientId',
    'dateOfConsult',
    'timeOfConsult'
  ],
  {
    $id: 'ConsultationsData'
  }
)
export type ConsultationsData = Static<typeof consultationsDataSchema>
export const consultationsDataValidator = getValidator(consultationsDataSchema, dataValidator)
export const consultationsDataResolver = resolve<Consultations, HookContext<ConsultationsService>>({})

// Schema for updating existing entries
export const consultationsPatchSchema = Type.Partial(consultationsSchema, {
  $id: 'ConsultationsPatch'
})
export type ConsultationsPatch = Static<typeof consultationsPatchSchema>
export const consultationsPatchValidator = getValidator(consultationsPatchSchema, dataValidator)
export const consultationsPatchResolver = resolve<Consultations, HookContext<ConsultationsService>>({})

// Schema for allowed query properties
export const consultationsQueryProperties = Type.Pick(consultationsSchema, ['status'])
export const consultationsQuerySchema = Type.Intersect(
  [
    querySyntax(consultationsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type ConsultationsQuery = Static<typeof consultationsQuerySchema>
export const consultationsQueryValidator = getValidator(consultationsQuerySchema, queryValidator)
export const consultationsQueryResolver = resolve<ConsultationsQuery, HookContext<ConsultationsService>>({})

export const ConsultationsDb = Type.Omit(consultationsSchema, ['_id'], {
  $id: 'ConsultationsDb'
})

const mongooseSchema = typeboxToMongooseSchema(ConsultationsDb)
export const ConsultationModal = makeMongooseModel('consultations', mongooseSchema)
