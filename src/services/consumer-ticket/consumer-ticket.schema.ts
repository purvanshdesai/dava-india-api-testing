// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { ConsumerTicketService } from './consumer-ticket.class'

// Main data model schema
export const consumerTicketSchema = Type.Object(
  {
    prescription_url: Type.Optional(Type.Array(Type.String())),
    items: Type.Optional(
      Type.Array(
        Type.Object({
          productId: Type.String(),
          quantity: Type.Number()
        })
      )
    ),
    issue: StringEnum(['prescription-upload', 'doctor-consultation']),
    address: Type.Optional(Type.Any()),
    comment: Type.Optional(Type.String()),
    phoneNumber: Type.Optional(Type.String())
  },
  { $id: 'ConsumerTicket', additionalProperties: false }
)
export type ConsumerTicket = Static<typeof consumerTicketSchema>
export const consumerTicketValidator = getValidator(consumerTicketSchema, dataValidator)
export const consumerTicketResolver = resolve<ConsumerTicket, HookContext<ConsumerTicketService>>({})

export const consumerTicketExternalResolver = resolve<ConsumerTicket, HookContext<ConsumerTicketService>>({})

// Schema for creating new entries
export const consumerTicketDataSchema = Type.Pick(
  consumerTicketSchema,
  ['prescription_url', 'items', 'issue', 'address', 'comment', 'phoneNumber'],
  {
    $id: 'ConsumerTicketData'
  }
)
export type ConsumerTicketData = Static<typeof consumerTicketDataSchema>
export const consumerTicketDataValidator = getValidator(consumerTicketDataSchema, dataValidator)
export const consumerTicketDataResolver = resolve<ConsumerTicket, HookContext<ConsumerTicketService>>({})

// Schema for updating existing entries
export const consumerTicketPatchSchema = Type.Partial(consumerTicketSchema, {
  $id: 'ConsumerTicketPatch'
})
export type ConsumerTicketPatch = Static<typeof consumerTicketPatchSchema>
export const consumerTicketPatchValidator = getValidator(consumerTicketPatchSchema, dataValidator)
export const consumerTicketPatchResolver = resolve<ConsumerTicket, HookContext<ConsumerTicketService>>({})

// Schema for allowed query properties
export const consumerTicketQueryProperties = Type.Pick(consumerTicketSchema, [])
export const consumerTicketQuerySchema = Type.Intersect(
  [
    querySyntax(consumerTicketQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type ConsumerTicketQuery = Static<typeof consumerTicketQuerySchema>
export const consumerTicketQueryValidator = getValidator(consumerTicketQuerySchema, queryValidator)
export const consumerTicketQueryResolver = resolve<ConsumerTicketQuery, HookContext<ConsumerTicketService>>(
  {}
)
