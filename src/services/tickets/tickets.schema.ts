// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax, ObjectIdSchema, StringEnum } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { TicketsService } from './tickets.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'
import { SUPPORTED_TICKET_ISSUE_TYPES } from './tickets.shared'

export const CONSTANTS = {
  TICKET_STATUS: { OPEN: 'open', REOPEN: 'reopen', CLOSED: 'closed' },
  PRIORITY: { LOW: 'low', MEDIUM: 'medium', HIGH: 'high' },
  CREATED_BY_USER_TYPE: { CONSUMER: 'consumer', SUPER_ADMIN: 'super-admin' }
}
// Main data model schema
export const ticketsSchema = Type.Object(
  {
    order: Type.Optional(ModelObjectId({ mongoose: { ref: 'orders' } })),
    ticketId: Type.String(),
    assignee: ModelObjectId({ mongoose: { ref: 'super-admin-users' } }),
    issue: StringEnum([...Object.values(SUPPORTED_TICKET_ISSUE_TYPES)]),
    issueParentCategory: StringEnum(['order-related', 'prescription-related']),
    comment: Type.Optional(Type.String()),
    attachments: Type.Optional(Type.Array(Type.Record(Type.String(), Type.Any()))),
    status: StringEnum([...Object.values(CONSTANTS.TICKET_STATUS)]),
    dueDate: Type.String({ format: 'date-time' }),
    priority: StringEnum([...Object.values(CONSTANTS.PRIORITY)]),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
    // createdBy: ModelObjectId({ mongoose: { ref: 'users' } }),
    prescriptionUrl: Type.Optional(Type.Array(Type.String())),
    createdBy: ObjectIdSchema(),
    createdByUserType: StringEnum([...Object.values(CONSTANTS.CREATED_BY_USER_TYPE)]),
    ticket: Type.Any(),
    skip: Type.Optional(Type.Number()),
    limit: Type.Optional(Type.Number()),
    search: Type.Optional(Type.String()),
    prescription_url: Type.Optional(Type.Array(Type.String())),
    items: Type.Optional(
      Type.Array(
        Type.Object({
          productId: Type.String(),
          quantity: Type.Number()
        })
      )
    ),
    address: Type.Optional(Type.Any()),
    phoneNumber: Type.Optional(Type.String()),
    patientId: Type.Optional(ModelObjectId({ mongoose: { ref: 'patients' } })),
    dateOfConsult: Type.Optional(Type.String({ format: 'date-time' })),
    timeOfConsult: Type.Optional(Type.String()),
    editedDateOfBirth: Type.Optional(Type.String({ format: 'date-time' }))
  },
  { $id: 'Tickets', additionalProperties: false }
)

export type Tickets = Static<typeof ticketsSchema>
export const ticketsValidator = getValidator(ticketsSchema, dataValidator)
export const ticketsResolver = resolve<Tickets, HookContext<TicketsService>>({})

export const ticketsExternalResolver = resolve<Tickets, HookContext<TicketsService>>({})

// Schema for creating new entries
export const ticketsDataSchema = Type.Pick(
  ticketsSchema,
  ['order', 'status', 'dueDate', 'priority', 'issue', 'phoneNumber'],
  {
    $id: 'TicketsData'
  }
)
export type TicketsData = Static<typeof ticketsDataSchema>
export const ticketsDataValidator = getValidator(ticketsDataSchema, dataValidator)
export const ticketsDataResolver = resolve<Tickets, HookContext<TicketsService>>({})

// Schema for updating existing entries
export const ticketsPatchSchema = Type.Partial(ticketsSchema, {
  $id: 'TicketsPatch'
})
export type TicketsPatch = Static<typeof ticketsPatchSchema>
export const ticketsPatchValidator = getValidator(ticketsPatchSchema, dataValidator)
export const ticketsPatchResolver = resolve<Tickets, HookContext<TicketsService>>({})

// Schema for allowed query properties
export const ticketsQueryProperties = Type.Pick(ticketsSchema, ['skip', 'limit', 'search'])
export const ticketsQuerySchema = Type.Intersect(
  [
    querySyntax(ticketsQueryProperties),
    // Add additional query properties here
    Type.Object(
      {
        statusFilter: Type.Optional(Type.Array(Type.String())),
        issueFilter: Type.Optional(Type.Array(Type.String())),
        dateRange: Type.Optional(Type.Any()),
        dateFilterType: Type.Optional(Type.String())
      },
      { additionalProperties: false }
    )
  ],
  { additionalProperties: false }
)
export type TicketsQuery = Static<typeof ticketsQuerySchema>
export const ticketsQueryValidator = getValidator(ticketsQuerySchema, queryValidator)
export const ticketsQueryResolver = resolve<TicketsQuery, HookContext<TicketsService>>({})

// consumer side
export const ticketsConsumerDataSchema = Type.Pick(
  ticketsSchema,
  [
    'order',
    'issue',
    'comment',
    'prescription_url',
    'address',
    'items',
    'phoneNumber',
    'patientId',
    'dateOfConsult',
    'timeOfConsult',
    'editedDateOfBirth'
  ],
  {
    $id: 'TicketsConsumerData'
  }
)
export type TicketsConsumerData = Static<typeof ticketsConsumerDataSchema>
export const ticketsConsumerDataValidator = getValidator(ticketsConsumerDataSchema, dataValidator)
export const ticketsConsumerDataResolver = resolve<Tickets, HookContext<TicketsService>>({})

// models
export const ticketsDb = Type.Pick(
  ticketsSchema,
  [
    'order',
    'ticketId',
    'assignee',
    'issue',
    'issueParentCategory',
    'comment',
    'attachments',
    'status',
    'dueDate',
    'priority',
    'createdBy',
    'createdByUserType',
    'createdAt',
    'updatedAt',
    'prescriptionUrl',
    'phoneNumber',
    'patientId',
    'dateOfConsult',
    'timeOfConsult',
    'editedDateOfBirth'
  ],
  { $id: 'TicketsDb' }
)
const ticketsMongooseSchema = typeboxToMongooseSchema(ticketsDb)
export const TicketsModel = makeMongooseModel('tickets', ticketsMongooseSchema)
