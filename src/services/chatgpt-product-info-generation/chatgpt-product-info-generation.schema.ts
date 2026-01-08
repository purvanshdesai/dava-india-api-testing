// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { ChatgptProductInfoGenerationService } from './chatgpt-product-info-generation.class'

// Main data model schema
export const chatgptProductInfoGenerationSchema = Type.Object(
  {
    productName: Type.String(),
    productDescription: Type.Optional(Type.String()),
    productCompositions: Type.String()
  },
  { $id: 'ChatgptProductInfoGeneration', additionalProperties: false }
)
export type ChatgptProductInfoGeneration = Static<typeof chatgptProductInfoGenerationSchema>
export const chatgptProductInfoGenerationValidator = getValidator(
  chatgptProductInfoGenerationSchema,
  dataValidator
)
export const chatgptProductInfoGenerationResolver = resolve<
  ChatgptProductInfoGeneration,
  HookContext<ChatgptProductInfoGenerationService>
>({})

export const chatgptProductInfoGenerationExternalResolver = resolve<
  ChatgptProductInfoGeneration,
  HookContext<ChatgptProductInfoGenerationService>
>({})

// Schema for creating new entries
export const chatgptProductInfoGenerationDataSchema = Type.Pick(
  chatgptProductInfoGenerationSchema,
  ['productName', 'productDescription', 'productCompositions'],
  {
    $id: 'ChatgptProductInfoGenerationData'
  }
)
export type ChatgptProductInfoGenerationData = Static<typeof chatgptProductInfoGenerationDataSchema>
export const chatgptProductInfoGenerationDataValidator = getValidator(
  chatgptProductInfoGenerationDataSchema,
  dataValidator
)
export const chatgptProductInfoGenerationDataResolver = resolve<
  ChatgptProductInfoGeneration,
  HookContext<ChatgptProductInfoGenerationService>
>({})

// Schema for updating existing entries
export const chatgptProductInfoGenerationPatchSchema = Type.Partial(chatgptProductInfoGenerationSchema, {
  $id: 'ChatgptProductInfoGenerationPatch'
})
export type ChatgptProductInfoGenerationPatch = Static<typeof chatgptProductInfoGenerationPatchSchema>
export const chatgptProductInfoGenerationPatchValidator = getValidator(
  chatgptProductInfoGenerationPatchSchema,
  dataValidator
)
export const chatgptProductInfoGenerationPatchResolver = resolve<
  ChatgptProductInfoGeneration,
  HookContext<ChatgptProductInfoGenerationService>
>({})

// Schema for allowed query properties
export const chatgptProductInfoGenerationQueryProperties = Type.Pick(chatgptProductInfoGenerationSchema, [])
export const chatgptProductInfoGenerationQuerySchema = Type.Intersect(
  [
    querySyntax(chatgptProductInfoGenerationQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type ChatgptProductInfoGenerationQuery = Static<typeof chatgptProductInfoGenerationQuerySchema>
export const chatgptProductInfoGenerationQueryValidator = getValidator(
  chatgptProductInfoGenerationQuerySchema,
  queryValidator
)
export const chatgptProductInfoGenerationQueryResolver = resolve<
  ChatgptProductInfoGenerationQuery,
  HookContext<ChatgptProductInfoGenerationService>
>({})
