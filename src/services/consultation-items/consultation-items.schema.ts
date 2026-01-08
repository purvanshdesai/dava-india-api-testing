// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { ConsultationItemsService } from './consultation-items.class'

// Main data model schema
export const consultationItemsSchema = Type.Object(
  {
    id: Type.Number(),
    text: Type.String()
  },
  { $id: 'ConsultationItems', additionalProperties: false }
)
export type ConsultationItems = Static<typeof consultationItemsSchema>
export const consultationItemsValidator = getValidator(consultationItemsSchema, dataValidator)
export const consultationItemsResolver = resolve<ConsultationItems, HookContext<ConsultationItemsService>>({})

export const consultationItemsExternalResolver = resolve<
  ConsultationItems,
  HookContext<ConsultationItemsService>
>({})

// Schema for creating new entries
export const consultationItemsDataSchema = Type.Pick(consultationItemsSchema, ['text'], {
  $id: 'ConsultationItemsData'
})
export type ConsultationItemsData = Static<typeof consultationItemsDataSchema>
export const consultationItemsDataValidator = getValidator(consultationItemsDataSchema, dataValidator)
export const consultationItemsDataResolver = resolve<
  ConsultationItems,
  HookContext<ConsultationItemsService>
>({})

// Schema for updating existing entries
export const consultationItemsPatchSchema = Type.Partial(consultationItemsSchema, {
  $id: 'ConsultationItemsPatch'
})
export type ConsultationItemsPatch = Static<typeof consultationItemsPatchSchema>
export const consultationItemsPatchValidator = getValidator(consultationItemsPatchSchema, dataValidator)
export const consultationItemsPatchResolver = resolve<
  ConsultationItems,
  HookContext<ConsultationItemsService>
>({})

// Schema for allowed query properties
export const consultationItemsQueryProperties = Type.Pick(consultationItemsSchema, ['id', 'text'])
export const consultationItemsQuerySchema = Type.Intersect(
  [
    querySyntax(consultationItemsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type ConsultationItemsQuery = Static<typeof consultationItemsQuerySchema>
export const consultationItemsQueryValidator = getValidator(consultationItemsQuerySchema, queryValidator)
export const consultationItemsQueryResolver = resolve<
  ConsultationItemsQuery,
  HookContext<ConsultationItemsService>
>({})
