// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  BulkUploadProcess,
  BulkUploadProcessData,
  BulkUploadProcessPatch,
  BulkUploadProcessQuery,
  BulkUploadProcessService
} from './bulk-upload-process.class'

export type { BulkUploadProcess, BulkUploadProcessData, BulkUploadProcessPatch, BulkUploadProcessQuery }

export type BulkUploadProcessClientService = Pick<
  BulkUploadProcessService<Params<BulkUploadProcessQuery>>,
  (typeof bulkUploadProcessMethods)[number]
>

export const bulkUploadProcessPath = 'bulk-upload-process'

export const bulkUploadProcessMethods: Array<keyof BulkUploadProcessService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const bulkUploadProcessClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(bulkUploadProcessPath, connection.service(bulkUploadProcessPath), {
    methods: bulkUploadProcessMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [bulkUploadProcessPath]: BulkUploadProcessClientService
  }
}
