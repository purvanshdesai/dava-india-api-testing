// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { ResendStoreInviteService } from './resend-store-invite.class'

// Main data model schema
export const resendStoreInviteSchema = Type.Object(
  {
    id: Type.Number(),
    text: Type.String()
  },
  { $id: 'ResendStoreInvite', additionalProperties: false }
)
export type ResendStoreInvite = Static<typeof resendStoreInviteSchema>
export const resendStoreInviteValidator = getValidator(resendStoreInviteSchema, dataValidator)
export const resendStoreInviteResolver = resolve<ResendStoreInvite, HookContext<ResendStoreInviteService>>({})

export const resendStoreInviteExternalResolver = resolve<
  ResendStoreInvite,
  HookContext<ResendStoreInviteService>
>({})

// Schema for creating new entries
export const resendStoreInviteDataSchema = Type.Pick(resendStoreInviteSchema, [], {
  $id: 'ResendStoreInviteData'
})
export type ResendStoreInviteData = Static<typeof resendStoreInviteDataSchema>
export const resendStoreInviteDataValidator = getValidator(resendStoreInviteDataSchema, dataValidator)
export const resendStoreInviteDataResolver = resolve<
  ResendStoreInvite,
  HookContext<ResendStoreInviteService>
>({})

// Schema for updating existing entries
export const resendStoreInvitePatchSchema = Type.Partial(resendStoreInviteSchema, {
  $id: 'ResendStoreInvitePatch'
})
export type ResendStoreInvitePatch = Static<typeof resendStoreInvitePatchSchema>
export const resendStoreInvitePatchValidator = getValidator(resendStoreInvitePatchSchema, dataValidator)
export const resendStoreInvitePatchResolver = resolve<
  ResendStoreInvite,
  HookContext<ResendStoreInviteService>
>({})

// Schema for allowed query properties
export const resendStoreInviteQueryProperties = Type.Pick(resendStoreInviteSchema, [])
export const resendStoreInviteQuerySchema = Type.Intersect(
  [
    querySyntax(resendStoreInviteQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type ResendStoreInviteQuery = Static<typeof resendStoreInviteQuerySchema>
export const resendStoreInviteQueryValidator = getValidator(resendStoreInviteQuerySchema, queryValidator)
export const resendStoreInviteQueryResolver = resolve<
  ResendStoreInviteQuery,
  HookContext<ResendStoreInviteService>
>({})
