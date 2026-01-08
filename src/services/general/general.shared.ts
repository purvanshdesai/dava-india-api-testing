// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { General, GeneralData, GeneralPatch, GeneralQuery, GeneralService } from './general.class'

export type { General, GeneralData, GeneralPatch, GeneralQuery }

export type GeneralClientService = Pick<GeneralService<Params<GeneralQuery>>, (typeof generalMethods)[number]>

export const generalPath = 'general/app-download'
export const versionUpdatePath = 'version-update'

export const generalMethods: Array<keyof GeneralService> = ['find', 'create']

export const generalClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(generalPath, connection.service(generalPath), {
    methods: generalMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [generalPath]: GeneralClientService
  }
}
