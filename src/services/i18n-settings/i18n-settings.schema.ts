// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { I18NSettingsService } from './i18n-settings.class'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const i18NSettingsSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    text: Type.String(),
    lookup_key: Type.String(),
    groups: Type.String(),
    referenceType: StringEnum(['value', 'entity']),
    translations: Type.Any()
  },
  { $id: 'I18NSettings', additionalProperties: false }
)
export type I18NSettings = Static<typeof i18NSettingsSchema>
export const i18NSettingsValidator = getValidator(i18NSettingsSchema, dataValidator)
export const i18NSettingsResolver = resolve<I18NSettings, HookContext<I18NSettingsService>>({})

export const i18NSettingsExternalResolver = resolve<I18NSettings, HookContext<I18NSettingsService>>({})

// Schema for creating new entries
export const i18NSettingsDataSchema = Type.Pick(i18NSettingsSchema, [], {
  $id: 'I18NSettingsData'
})
export type I18NSettingsData = Static<typeof i18NSettingsDataSchema>
export const i18NSettingsDataValidator = getValidator(i18NSettingsDataSchema, dataValidator)
export const i18NSettingsDataResolver = resolve<I18NSettings, HookContext<I18NSettingsService>>({})

// Schema for updating existing entries
export const i18NSettingsPatchSchema = Type.Partial(i18NSettingsSchema, {
  $id: 'I18NSettingsPatch'
})
export type I18NSettingsPatch = Static<typeof i18NSettingsPatchSchema>
export const i18NSettingsPatchValidator = getValidator(i18NSettingsPatchSchema, dataValidator)
export const i18NSettingsPatchResolver = resolve<I18NSettings, HookContext<I18NSettingsService>>({})

// Schema for allowed query properties
export const i18NSettingsQueryProperties = Type.Pick(i18NSettingsSchema, ['_id', 'text'])
export const i18NSettingsQuerySchema = Type.Intersect(
  [
    querySyntax(i18NSettingsQueryProperties, {
      text: {
        $regex: Type.String(),
        $options: Type.String()
      }
    }),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: true }
)
export type I18NSettingsQuery = Static<typeof i18NSettingsQuerySchema>
export const i18NSettingsQueryValidator = getValidator(i18NSettingsQuerySchema, queryValidator)
export const i18NSettingsQueryResolver = resolve<I18NSettingsQuery, HookContext<I18NSettingsService>>({})

export const I18NSettingsDB = Type.Omit(i18NSettingsSchema, ['_id'], { $id: 'I18NSettingsDB' })

export type TI18NSettingsDB = Static<typeof i18NSettingsSchema>

const mongooseSchema = typeboxToMongooseSchema(I18NSettingsDB)
export const I18NSettingModel = makeMongooseModel('i18n-settings', mongooseSchema)
