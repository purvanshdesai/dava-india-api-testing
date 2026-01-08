// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Exports, ExportsData, ExportsPatch, ExportsQuery, ExportsService } from './exports.class'

export type { Exports, ExportsData, ExportsPatch, ExportsQuery }

export type ExportsClientService = Pick<ExportsService<Params<ExportsQuery>>, (typeof exportsMethods)[number]>

export const exportsPath = 'exports'

export const exportsMethods: Array<keyof ExportsService> = ['create']

export const exportsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(exportsPath, connection.service(exportsPath), {
    methods: exportsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [exportsPath]: ExportsClientService
  }
}
