// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { ContactService } from './contact.class'

// Main data model schema
export const contactSchema = Type.Object(
  {
    id: Type.Number(),
    name: Type.String(),
    email: Type.String(),
    phoneNumber: Type.String(),
    message: Type.String()
  },
  { $id: 'Contact', additionalProperties: false }
)
export type Contact = Static<typeof contactSchema>
export const contactValidator = getValidator(contactSchema, dataValidator)
export const contactResolver = resolve<Contact, HookContext<ContactService>>({})

export const contactExternalResolver = resolve<Contact, HookContext<ContactService>>({})

// Schema for creating new entries
export const contactDataSchema = Type.Pick(contactSchema, ['name', 'email', 'phoneNumber', 'message'], {
  $id: 'ContactData'
})
export type ContactData = Static<typeof contactDataSchema>
export const contactDataValidator = getValidator(contactDataSchema, dataValidator)
export const contactDataResolver = resolve<Contact, HookContext<ContactService>>({})

// Schema for updating existing entries
export const contactPatchSchema = Type.Partial(contactSchema, {
  $id: 'ContactPatch'
})
export type ContactPatch = Static<typeof contactPatchSchema>
export const contactPatchValidator = getValidator(contactPatchSchema, dataValidator)
export const contactPatchResolver = resolve<Contact, HookContext<ContactService>>({})

// Schema for allowed query properties
export const contactQueryProperties = Type.Pick(contactSchema, ['id'])
export const contactQuerySchema = Type.Intersect(
  [
    querySyntax(contactQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type ContactQuery = Static<typeof contactQuerySchema>
export const contactQueryValidator = getValidator(contactQuerySchema, queryValidator)
export const contactQueryResolver = resolve<ContactQuery, HookContext<ContactService>>({})
