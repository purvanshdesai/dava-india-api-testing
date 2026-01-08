// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../../client'
import type {
  InventoryBulkUpload,
  InventoryBulkUploadData,
  InventoryBulkUploadPatch,
  InventoryBulkUploadQuery,
  InventoryBulkUploadService
} from './inventory-bulk-upload.class'
import path from 'path'
import { BadRequest } from '@feathersjs/errors'
import fs from 'fs'
import { handleProcessFileRecords } from '../../../utils/inventory-upload'
import { BulkUploadProcessModel } from '../../bulk-upload-process/bulk-upload-process.schema'
import { useWorkerToReadFile } from '../../../utils/inventory-upload'

export type {
  InventoryBulkUpload,
  InventoryBulkUploadData,
  InventoryBulkUploadPatch,
  InventoryBulkUploadQuery
}

export type InventoryBulkUploadClientService = Pick<
  InventoryBulkUploadService<Params<InventoryBulkUploadQuery>>,
  (typeof inventoryBulkUploadMethods)[number]
>

export const inventoryBulkUploadPath = 'bulk-upload/inventory-bulk-upload'
export const adminInventoryBulkUploadPath = 'super-admin/bulk-upload/inventory-bulk-upload'

export const inventoryBulkUploadMethods: Array<keyof InventoryBulkUploadService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const inventoryBulkUploadClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(inventoryBulkUploadPath, connection.service(inventoryBulkUploadPath), {
    methods: inventoryBulkUploadMethods
  })
}

// Add this service to the client service type index
declare module '../../../client' {
  interface ServiceTypes {
    [inventoryBulkUploadPath]: InventoryBulkUploadClientService
  }
}

export const readUploadedInventoryFile = async (data: any) => {
  try {
    return new Promise(async (resolve) => {
      const { fileName, objectUrl } = data
      const attachmentsDirectory = path.resolve(__dirname, `../../../../public/attachments`)
      const filePath = `${attachmentsDirectory}/${fileName}`

      if (!fs.existsSync(filePath)) throw new BadRequest('File does not exist')

      await useWorkerToReadFile({ filePath, objectUrl }, (records: any[]) => {
        resolve(records)
      })
    })
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const processUploadedInventoryRecords = async (records: any, params: any) => {
  try {
    await handleProcessFileRecords(records, params)
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const createBulkUploadProcessEntry = async ({
  errorsCount,
  total,
  user,
  userType,
  processName
}: any) => {
  try {
    let opts: any = { storeAdminUser: user?._id }

    if (userType === 'super-admin') opts = { superAdminUser: user?._id }

    return (
      await BulkUploadProcessModel.create({
        processName,
        type: userType,
        status: 'pending',
        errors: errorsCount,
        totalRecords: total,
        ...opts, // either store or super admin
        percentage: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    ).toObject()
  } catch (e) {}
}
