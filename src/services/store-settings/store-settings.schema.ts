// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { StoreSettingsService } from './store-settings.class'

// Main data model schema
export const storeSettingsSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    text: Type.Optional(Type.String())
  },
  { $id: 'StoreSettings', additionalProperties: true }
)
export type StoreSettings = Static<typeof storeSettingsSchema>
export const storeSettingsValidator = getValidator(storeSettingsSchema, dataValidator)
export const storeSettingsResolver = resolve<StoreSettings, HookContext<StoreSettingsService>>({})

export const storeSettingsExternalResolver = resolve<StoreSettings, HookContext<StoreSettingsService>>({})

// Schema for creating new entries
export const storeSettingsDataSchema = Type.Pick(storeSettingsSchema, ['text'], {
  $id: 'StoreSettingsData'
})
export type StoreSettingsData = Static<typeof storeSettingsDataSchema>
export const storeSettingsDataValidator = getValidator(storeSettingsDataSchema, dataValidator)
export const storeSettingsDataResolver = resolve<StoreSettings, HookContext<StoreSettingsService>>({})

// Schema for updating existing entries
export const storeSettingsPatchSchema = Type.Partial(storeSettingsSchema, {
  $id: 'StoreSettingsPatch'
})
export type StoreSettingsPatch = Static<typeof storeSettingsPatchSchema>
export const storeSettingsPatchValidator = getValidator(storeSettingsPatchSchema, dataValidator)
export const storeSettingsPatchResolver = resolve<StoreSettings, HookContext<StoreSettingsService>>({})

// Schema for allowed query properties
export const storeSettingsQueryProperties = Type.Pick(storeSettingsSchema, ['_id', 'text'])
export const storeSettingsQuerySchema = Type.Intersect(
  [
    querySyntax(storeSettingsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: true })
  ],
  { additionalProperties: true }
)
export type StoreSettingsQuery = Static<typeof storeSettingsQuerySchema>
export const storeSettingsQueryValidator = getValidator(storeSettingsQuerySchema, queryValidator)
export const storeSettingsQueryResolver = resolve<StoreSettingsQuery, HookContext<StoreSettingsService>>({})
