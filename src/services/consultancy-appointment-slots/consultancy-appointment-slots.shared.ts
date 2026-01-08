// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  ConsultancyAppointmentSlots,
  ConsultancyAppointmentSlotsData,
  ConsultancyAppointmentSlotsPatch,
  ConsultancyAppointmentSlotsQuery,
  ConsultancyAppointmentSlotsService
} from './consultancy-appointment-slots.class'

export type {
  ConsultancyAppointmentSlots,
  ConsultancyAppointmentSlotsData,
  ConsultancyAppointmentSlotsPatch,
  ConsultancyAppointmentSlotsQuery
}

export type ConsultancyAppointmentSlotsClientService = Pick<
  ConsultancyAppointmentSlotsService<Params<ConsultancyAppointmentSlotsQuery>>,
  (typeof consultancyAppointmentSlotsMethods)[number]
>

export const consultancyAppointmentSlotsPath = 'consultancy-appointment-slots'

export const consultancyAppointmentSlotsMethods: Array<keyof ConsultancyAppointmentSlotsService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const consultancyAppointmentSlotsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(consultancyAppointmentSlotsPath, connection.service(consultancyAppointmentSlotsPath), {
    methods: consultancyAppointmentSlotsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [consultancyAppointmentSlotsPath]: ConsultancyAppointmentSlotsClientService
  }
}
