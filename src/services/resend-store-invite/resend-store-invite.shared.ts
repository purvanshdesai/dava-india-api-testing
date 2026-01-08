// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  ResendStoreInvite,
  ResendStoreInviteData,
  ResendStoreInvitePatch,
  ResendStoreInviteQuery,
  ResendStoreInviteService
} from './resend-store-invite.class'

export type { ResendStoreInvite, ResendStoreInviteData, ResendStoreInvitePatch, ResendStoreInviteQuery }

export const resendStoreInvitePath = 'resend-store-invite'

export const resendStoreInviteMethods: Array<keyof ResendStoreInviteService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]
