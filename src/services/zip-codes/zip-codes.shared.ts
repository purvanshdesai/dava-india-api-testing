// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { ZipCodes, ZipCodesData, ZipCodesPatch, ZipCodesQuery, ZipCodesService } from './zip-codes.class'

export type { ZipCodes, ZipCodesData, ZipCodesPatch, ZipCodesQuery }

export type ZipCodesClientService = Pick<
  ZipCodesService<Params<ZipCodesQuery>>,
  (typeof zipCodesMethods)[number]
>

export const zipCodesPath = 'zip-codes'
export const consumerZipCodesPath = '/consumer/zip-codes'
export const bulkUploadPincodesPath = 'zip-codes/bulk-upload'
export const defaultZipCode = 560068

export const zipCodesMethods: Array<keyof ZipCodesService> = ['find', 'get', 'create', 'patch', 'remove']

export const zipCodesClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(zipCodesPath, connection.service(zipCodesPath), {
    methods: zipCodesMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [zipCodesPath]: ZipCodesClientService
  }
}
