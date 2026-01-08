// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax, StringEnum, ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { SupportService } from './support.class'
import { ModelObjectId } from '../../utils'
import { CONSTANTS, ticketsSchema } from '../tickets/tickets.schema'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const supportSchema = Type.Object(
  {
    ticket: ModelObjectId({ mongoose: { ref: 'tickets' } }),
    activity: StringEnum([
      'ticket-created',
      'assignee-changed',
      'status-updated',
      'attachment-added',
      'attachment-removed',
      'note-added',
      'due-date-changed',
      'order-created',
      'prescription-approved',
      'prescription-rejected'
    ]),
    status: Type.Optional(Type.String()),
    content: Type.Optional(Type.Any()),
    attachments: Type.Optional(Type.Array(Type.Record(Type.String(), Type.Any()))),
    createdAt: Type.String({ format: 'date-time' }),
    createdBy: ObjectIdSchema(),
    createdByUserType: StringEnum([...Object.values(CONSTANTS.CREATED_BY_USER_TYPE)])
  },
  { $id: 'Support', additionalProperties: false }
)
export type Support = Static<typeof supportSchema>
export const supportValidator = getValidator(supportSchema, dataValidator)
export const supportResolver = resolve<Support, HookContext<SupportService>>({})

export const supportExternalResolver = resolve<Support, HookContext<SupportService>>({})

// Schema for creating new entries
export const supportDataSchema = Type.Pick(supportSchema, ['activity', 'status', 'content', 'attachments'], {
  $id: 'SupportData'
})
export type SupportData = Static<typeof supportDataSchema>
export const supportDataValidator = getValidator(supportDataSchema, dataValidator)
export const supportDataResolver = resolve<Support, HookContext<SupportService>>({})

// Schema for updating existing entries
export const supportPatchSchema = Type.Partial(supportSchema, {
  $id: 'SupportPatch'
})
export type SupportPatch = Static<typeof supportPatchSchema>
export const supportPatchValidator = getValidator(supportPatchSchema, dataValidator)
export const supportPatchResolver = resolve<Support, HookContext<SupportService>>({})

// Schema for allowed query properties
export const supportQueryProperties = Type.Pick(supportSchema, [])
export const supportQuerySchema = Type.Intersect(
  [
    querySyntax(supportQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type SupportQuery = Static<typeof supportQuerySchema>
export const supportQueryValidator = getValidator(supportQuerySchema, queryValidator)
export const supportQueryResolver = resolve<SupportQuery, HookContext<SupportService>>({})

export const ticketActivitiesDb = Type.Pick(
  supportSchema,
  ['ticket', 'activity', 'status', 'content', 'attachments', 'createdAt', 'createdBy', 'createdByUserType'],
  { $id: 'TicketActivitiesDb' }
)
const ticketActivitiesMongooseSchema = typeboxToMongooseSchema(ticketActivitiesDb)
export const TicketActivitiesModel = makeMongooseModel('ticket-activities', ticketActivitiesMongooseSchema)
