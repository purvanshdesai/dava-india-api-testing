// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  BulkUpload,
  BulkUploadData,
  BulkUploadPatch,
  BulkUploadQuery,
  BulkUploadService
} from './bulk-upload.class'

export type { BulkUpload, BulkUploadData, BulkUploadPatch, BulkUploadQuery }

export type BulkUploadClientService = Pick<
  BulkUploadService<Params<BulkUploadQuery>>,
  (typeof bulkUploadMethods)[number]
>

export const bulkUploadPath = 'bulk-upload'

export const bulkUploadMethods: Array<keyof BulkUploadService> = ['find', 'get', 'create', 'patch', 'remove']

export const bulkUploadClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(bulkUploadPath, connection.service(bulkUploadPath), {
    methods: bulkUploadMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [bulkUploadPath]: BulkUploadClientService
  }
}
