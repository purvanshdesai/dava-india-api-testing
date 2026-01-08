// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  AdminZipCodes,
  AdminZipCodesData,
  AdminZipCodesPatch,
  AdminZipCodesQuery,
  AdminZipCodesService
} from './admin-zip-codes.class'

export type { AdminZipCodes, AdminZipCodesData, AdminZipCodesPatch, AdminZipCodesQuery }

export type AdminZipCodesClientService = Pick<
  AdminZipCodesService<Params<AdminZipCodesQuery>>,
  (typeof adminZipCodesMethods)[number]
>

export const adminZipCodesPath = 'admin-zip-codes'

export const adminZipCodesMethods: Array<keyof AdminZipCodesService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const adminZipCodesClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(adminZipCodesPath, connection.service(adminZipCodesPath), {
    methods: adminZipCodesMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [adminZipCodesPath]: AdminZipCodesClientService
  }
}
