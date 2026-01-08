// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  ConsultationItems,
  ConsultationItemsData,
  ConsultationItemsPatch,
  ConsultationItemsQuery,
  ConsultationItemsService
} from './consultation-items.class'

export type { ConsultationItems, ConsultationItemsData, ConsultationItemsPatch, ConsultationItemsQuery }

export type ConsultationItemsClientService = Pick<
  ConsultationItemsService,
  (typeof consultationItemsMethods)[number]
>

export const consultationItemsPath = 'consultation-items'

export const consultationItemsMethods: Array<keyof ConsultationItemsService> = ['get']

export const consultationItemsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(consultationItemsPath, connection.service(consultationItemsPath), {
    methods: consultationItemsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [consultationItemsPath]: ConsultationItemsClientService
  }
}
