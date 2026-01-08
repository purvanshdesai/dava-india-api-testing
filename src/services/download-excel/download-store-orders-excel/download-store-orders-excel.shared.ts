// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../../client'
import type {
  DownloadStoreOrdersExcel,
  DownloadStoreOrdersExcelData,
  DownloadStoreOrdersExcelPatch,
  DownloadStoreOrdersExcelQuery,
  DownloadStoreOrdersExcelService
} from './download-store-orders-excel.class'

export type {
  DownloadStoreOrdersExcel,
  DownloadStoreOrdersExcelData,
  DownloadStoreOrdersExcelPatch,
  DownloadStoreOrdersExcelQuery
}

export type DownloadStoreOrdersExcelClientService = Pick<
  DownloadStoreOrdersExcelService<Params<DownloadStoreOrdersExcelQuery>>,
  (typeof downloadStoreOrdersExcelMethods)[number]
>

export const downloadStoreOrdersExcelPath = 'download-excel/download-store-orders-excel'

export const downloadStoreOrdersExcelMethods: Array<keyof DownloadStoreOrdersExcelService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const downloadStoreOrdersExcelClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(downloadStoreOrdersExcelPath, connection.service(downloadStoreOrdersExcelPath), {
    methods: downloadStoreOrdersExcelMethods
  })
}

// Add this service to the client service type index
declare module '../../../client' {
  interface ServiceTypes {
    [downloadStoreOrdersExcelPath]: DownloadStoreOrdersExcelClientService
  }
}
