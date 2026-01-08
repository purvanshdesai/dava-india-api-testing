// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  PrescriptionStatus,
  PrescriptionStatusData,
  PrescriptionStatusPatch,
  PrescriptionStatusQuery,
  PrescriptionStatusService
} from './prescription-status.class'

export type { PrescriptionStatus, PrescriptionStatusData, PrescriptionStatusPatch, PrescriptionStatusQuery }

export type PrescriptionStatusClientService = Pick<
  PrescriptionStatusService,
  (typeof prescriptionStatusMethods)[number]
>

export const prescriptionStatusPath = 'prescription-status'

export const prescriptionStatusMethods: Array<keyof PrescriptionStatusService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const prescriptionStatusClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(prescriptionStatusPath, connection.service(prescriptionStatusPath), {
    methods: prescriptionStatusMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [prescriptionStatusPath]: PrescriptionStatusClientService
  }
}
