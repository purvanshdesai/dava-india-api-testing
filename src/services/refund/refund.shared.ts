// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Refund, RefundData, RefundPatch, RefundQuery, RefundService } from './refund.class'

export type { Refund, RefundData, RefundPatch, RefundQuery }

export const refundPath = 'refund'

export const refundMethods: Array<keyof RefundService> = []
