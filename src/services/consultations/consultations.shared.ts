// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Consultations,
  ConsultationsData,
  ConsultationsPatch,
  ConsultationsQuery,
  ConsultationsService
} from './consultations.class'

export type { Consultations, ConsultationsData, ConsultationsPatch, ConsultationsQuery }

export type ConsultationsClientService = Pick<ConsultationsService, (typeof consultationsMethods)[number]>

export const consultationsPath = 'consultations'

export const consultationsMethods: Array<keyof ConsultationsService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const consultationsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(consultationsPath, connection.service(consultationsPath), {
    methods: consultationsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [consultationsPath]: ConsultationsClientService
  }
}
