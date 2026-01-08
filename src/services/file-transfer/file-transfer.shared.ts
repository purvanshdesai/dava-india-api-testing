// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  FileTransfer,
  FileTransferData,
  FileTransferPatch,
  FileTransferQuery,
  FileTransferService
} from './file-transfer.class'

export type { FileTransfer, FileTransferData, FileTransferPatch, FileTransferQuery }

export type FileTransferClientService = Pick<
  FileTransferService<Params<FileTransferQuery>>,
  (typeof fileTransferMethods)[number]
>

export const fileTransferPath = 'file-transfer'

export const fileTransferMethods: Array<keyof FileTransferService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const fileTransferClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(fileTransferPath, connection.service(fileTransferPath), {
    methods: fileTransferMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [fileTransferPath]: FileTransferClientService
  }
}
