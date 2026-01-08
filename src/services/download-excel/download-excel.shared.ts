// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  DownloadExcel,
  DownloadExcelData,
  DownloadExcelPatch,
  DownloadExcelQuery,
  DownloadExcelService
} from './download-excel.class'

export type { DownloadExcel, DownloadExcelData, DownloadExcelPatch, DownloadExcelQuery }

export type DownloadExcelClientService = Pick<
  DownloadExcelService<Params<DownloadExcelQuery>>,
  (typeof downloadExcelMethods)[number]
>

export const downloadExcelPath = 'download-excel'

export const downloadExcelMethods: Array<keyof DownloadExcelService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const downloadExcelClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(downloadExcelPath, connection.service(downloadExcelPath), {
    methods: downloadExcelMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [downloadExcelPath]: DownloadExcelClientService
  }
}
