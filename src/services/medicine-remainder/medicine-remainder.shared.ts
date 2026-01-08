// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  MedicineRemainder,
  MedicineRemainderData,
  MedicineRemainderPatch,
  MedicineRemainderQuery,
  MedicineRemainderService
} from './medicine-remainder.class'

export type { MedicineRemainder, MedicineRemainderData, MedicineRemainderPatch, MedicineRemainderQuery }

export type MedicineRemainderClientService = Pick<
  MedicineRemainderService<Params<MedicineRemainderQuery>>,
  (typeof medicineRemainderMethods)[number]
>

export const medicineRemainderPath = 'medicine-remainder'

export const medicineRemainderMethods: Array<keyof MedicineRemainderService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const medicineRemainderClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(medicineRemainderPath, connection.service(medicineRemainderPath), {
    methods: medicineRemainderMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [medicineRemainderPath]: MedicineRemainderClientService
  }
}
