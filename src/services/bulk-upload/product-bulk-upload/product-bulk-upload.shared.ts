// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../../client'
import type {
  ProductBulkUpload,
  ProductBulkUploadData,
  ProductBulkUploadPatch,
  ProductBulkUploadQuery,
  ProductBulkUploadService
} from './product-bulk-upload.class'

export type { ProductBulkUpload, ProductBulkUploadData, ProductBulkUploadPatch, ProductBulkUploadQuery }

export type ProductBulkUploadClientService = Pick<
  ProductBulkUploadService<Params<ProductBulkUploadQuery>>,
  (typeof productBulkUploadMethods)[number]
>

export const productBulkUploadPath = 'product-bulk-upload'

export const productBulkUploadMethods: Array<keyof ProductBulkUploadService> = ['create']

export const productBulkUploadClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(productBulkUploadPath, connection.service(productBulkUploadPath), {
    methods: productBulkUploadMethods
  })
}

// Add this service to the client service type index
declare module '../../../client' {
  interface ServiceTypes {
    [productBulkUploadPath]: ProductBulkUploadClientService
  }
}
