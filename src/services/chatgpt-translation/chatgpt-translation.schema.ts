// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { ChatgptTranslationService } from './chatgpt-translation.class'

// Main data model schema
export const chatgptTranslationSchema = Type.Object(
  {
    text: Type.String(),
    translateType: Type.Optional(StringEnum(['productTranslate'])),
    translationFor: Type.Optional(Type.String())
  },
  { $id: 'ChatgptTranslation', additionalProperties: false }
)
export type ChatgptTranslation = Static<typeof chatgptTranslationSchema>
export const chatgptTranslationValidator = getValidator(chatgptTranslationSchema, dataValidator)
export const chatgptTranslationResolver = resolve<ChatgptTranslation, HookContext<ChatgptTranslationService>>(
  {}
)

export const chatgptTranslationExternalResolver = resolve<
  ChatgptTranslation,
  HookContext<ChatgptTranslationService>
>({})

// Schema for creating new entries
export const chatgptTranslationDataSchema = Type.Pick(
  chatgptTranslationSchema,
  ['text', 'translateType', 'translationFor'],
  {
    $id: 'ChatgptTranslationData'
  }
)
export type ChatgptTranslationData = Static<typeof chatgptTranslationDataSchema>
export const chatgptTranslationDataValidator = getValidator(chatgptTranslationDataSchema, dataValidator)
export const chatgptTranslationDataResolver = resolve<
  ChatgptTranslation,
  HookContext<ChatgptTranslationService>
>({})

// Schema for updating existing entries
export const chatgptTranslationPatchSchema = Type.Partial(chatgptTranslationSchema, {
  $id: 'ChatgptTranslationPatch'
})
export type ChatgptTranslationPatch = Static<typeof chatgptTranslationPatchSchema>
export const chatgptTranslationPatchValidator = getValidator(chatgptTranslationPatchSchema, dataValidator)
export const chatgptTranslationPatchResolver = resolve<
  ChatgptTranslation,
  HookContext<ChatgptTranslationService>
>({})

// Schema for allowed query properties
export const chatgptTranslationQueryProperties = Type.Pick(chatgptTranslationSchema, ['text'])
export const chatgptTranslationQuerySchema = Type.Intersect(
  [
    querySyntax(chatgptTranslationQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type ChatgptTranslationQuery = Static<typeof chatgptTranslationQuerySchema>
export const chatgptTranslationQueryValidator = getValidator(chatgptTranslationQuerySchema, queryValidator)
export const chatgptTranslationQueryResolver = resolve<
  ChatgptTranslationQuery,
  HookContext<ChatgptTranslationService>
>({})
