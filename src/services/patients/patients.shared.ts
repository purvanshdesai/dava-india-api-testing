// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Patients, PatientsData, PatientsPatch, PatientsQuery, PatientsService } from './patients.class'

export type { Patients, PatientsData, PatientsPatch, PatientsQuery }

export type PatientsClientService = Pick<
  PatientsService<Params<PatientsQuery>>,
  (typeof patientsMethods)[number]
>

export const patientsPath = 'patients'

export const patientsMethods: Array<keyof PatientsService> = ['find', 'get', 'create', 'patch', 'remove']

export const patientsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(patientsPath, connection.service(patientsPath), {
    methods: patientsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [patientsPath]: PatientsClientService
  }
}
