// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax, StringEnum } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { SettingsService } from './settings.class'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

const settings = Type.Object({
  settingType: StringEnum(['handlingCharge', 'packingCharge', 'platformFee']),
  settingCategory: StringEnum(['general']),
  value: Type.Record(Type.String(), Type.Any())
})
// Main data model schema
export const settingsSchema = Type.Intersect(
  [
    Type.Object({
      settings: Type.Array(settings),
      createdAt: Type.Optional(Type.String({ format: 'date-time' })),
      updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
    }),
    settings // Include the settings schema here
  ],
  { $id: 'Settings', additionalProperties: false }
)

export type Settings = Static<typeof settingsSchema>
export const settingsValidator = getValidator(settingsSchema, dataValidator)
export const settingsResolver = resolve<Settings, HookContext<SettingsService>>({})

export const settingsExternalResolver = resolve<Settings, HookContext<SettingsService>>({})

// Schema for creating new entries
export const settingsDataSchema = Type.Pick(settingsSchema, ['settings'], {
  $id: 'SettingsData'
})
export type SettingsData = Static<typeof settingsDataSchema>
export const settingsDataValidator = getValidator(settingsDataSchema, dataValidator)
export const settingsDataResolver = resolve<Settings, HookContext<SettingsService>>({})

// Schema for updating existing entries
export const settingsPatchSchema = Type.Partial(settingsSchema, {
  $id: 'SettingsPatch'
})
export type SettingsPatch = Static<typeof settingsPatchSchema>
export const settingsPatchValidator = getValidator(settingsPatchSchema, dataValidator)
export const settingsPatchResolver = resolve<Settings, HookContext<SettingsService>>({})

// Schema for allowed query properties
export const settingsQueryProperties = Type.Pick(settingsSchema, [])
export const settingsQuerySchema = Type.Intersect(
  [
    querySyntax(settingsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type SettingsQuery = Static<typeof settingsQuerySchema>
export const settingsQueryValidator = getValidator(settingsQuerySchema, queryValidator)
export const settingsQueryResolver = resolve<SettingsQuery, HookContext<SettingsService>>({})

export const SettingsDb = Type.Pick(
  settingsSchema,
  ['settingType', 'settingCategory', 'value', 'createdAt', 'updatedAt'],
  { $id: 'SettingsDb' }
)
const mongooseSchema = typeboxToMongooseSchema(SettingsDb)
export const SettingsModel = makeMongooseModel('settings', mongooseSchema)
