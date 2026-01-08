// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { WebhooksService } from './webhooks.class'

// Main data model schema
export const webhooksSchema = Type.Object(
  {
    id: Type.Number(),
    text: Type.String()
  },
  { $id: 'Webhooks', additionalProperties: false }
)
export type Webhooks = Static<typeof webhooksSchema>
export const webhooksValidator = getValidator(webhooksSchema, dataValidator)
export const webhooksResolver = resolve<Webhooks, HookContext<WebhooksService>>({})

export const webhooksExternalResolver = resolve<Webhooks, HookContext<WebhooksService>>({})

// Schema for creating new entries
export const webhooksDataSchema = Type.Pick(webhooksSchema, ['text'], {
  $id: 'WebhooksData'
})
export type WebhooksData = Static<typeof webhooksDataSchema>
export const webhooksDataValidator = getValidator(webhooksDataSchema, dataValidator)
export const webhooksDataResolver = resolve<Webhooks, HookContext<WebhooksService>>({})

// Schema for updating existing entries
export const webhooksPatchSchema = Type.Partial(webhooksSchema, {
  $id: 'WebhooksPatch'
})
export type WebhooksPatch = Static<typeof webhooksPatchSchema>
export const webhooksPatchValidator = getValidator(webhooksPatchSchema, dataValidator)
export const webhooksPatchResolver = resolve<Webhooks, HookContext<WebhooksService>>({})

// Schema for allowed query properties
export const webhooksQueryProperties = Type.Pick(webhooksSchema, ['id', 'text'])
export const webhooksQuerySchema = Type.Intersect(
  [
    querySyntax(webhooksQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type WebhooksQuery = Static<typeof webhooksQuerySchema>
export const webhooksQueryValidator = getValidator(webhooksQuerySchema, queryValidator)
export const webhooksQueryResolver = resolve<WebhooksQuery, HookContext<WebhooksService>>({})
