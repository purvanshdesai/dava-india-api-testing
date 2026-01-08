// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../../client'
import type {
  StoreAdminUsersPrescriptionStatus,
  StoreAdminUsersPrescriptionStatusData,
  StoreAdminUsersPrescriptionStatusPatch,
  StoreAdminUsersPrescriptionStatusQuery,
  StoreAdminUsersPrescriptionStatusService
} from './prescription-status.class'

export type {
  StoreAdminUsersPrescriptionStatus,
  StoreAdminUsersPrescriptionStatusData,
  StoreAdminUsersPrescriptionStatusPatch,
  StoreAdminUsersPrescriptionStatusQuery
}

export const storeAdminUsersPrescriptionStatusPath = 'store-admin-users/prescription-status'

export const storeAdminUsersPrescriptionStatusMethods: Array<keyof StoreAdminUsersPrescriptionStatusService> =
  ['find', 'get', 'create', 'patch', 'remove']
