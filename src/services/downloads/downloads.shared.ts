// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import {
  DownloadInvoiceService,
  Downloads,
  DownloadsData,
  DownloadsPatch,
  DownloadsQuery,
  DownloadsService
} from './downloads.class'

export type { Downloads, DownloadsData, DownloadsPatch, DownloadsQuery }

export type DownloadsClientService = Pick<
  DownloadsService<Params<DownloadsQuery>>,
  (typeof downloadsMethods)[number]
>

export const downloadsPath = 'downloads'
export const downloadsMethods: Array<keyof DownloadsService> = ['find', 'get', 'create', 'patch', 'remove']

export const downloadInvoicePath = 'downloads/invoice'
export const downloadInvoiceMethods: Array<keyof DownloadInvoiceService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const downloadsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(downloadsPath, connection.service(downloadsPath), {
    methods: downloadsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [downloadsPath]: DownloadsClientService
  }
}
