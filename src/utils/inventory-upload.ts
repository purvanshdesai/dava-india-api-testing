import { app } from '../app'
import { Worker } from 'worker_threads'
import path from 'path'
import { BulkUploadProcessModel } from '../services/bulk-upload-process/bulk-upload-process.schema'
import { addInventoryStockEntry } from './inventory'
import { StoreInventoryModel } from '../services/store-inventory/store-inventory.schema'
import mongoose from 'mongoose'
import promiseLimit from 'promise-limit'
import { StoreModel } from '../services/stores/stores.schema'
import { ProductsModel } from '../services/super-admin/products/products.schema'
import moment from 'moment'
import axios from 'axios'
import { appConfig } from './config'
import crypto from 'crypto'

export type InventoryItem = {
  storeCode: string
  areaName: string
  date: string | number
  gstNo: string
  state: string
  productCode: string
  productName: string
  genericName: string
  productCategory: string
  packSize: string
  batchNo: string
  expiryDate: string
  quantity: string
  mrp: string
  purchaseRate: string
  totalAmount: string
}

interface InventoryRowRec {
  storeId: string
  productId: string
  expiryDate: Date
  quantity: number
  batchNo: string
  inventoryId?: string
  batchStock: number
}

interface Batch {
  batchNo: string
  stock: number
}

type StoreInventoryMap = Record<string, InventoryItem[]>
type StoreInventoryMapNew = Map<string, Map<string, Map<string, Batch>>>

const BULK_UPLOAD_HEADERS = {
  STORE_CODE: 'storeCode',
  BATCH: 'batchNo',
  EXPIRY_DATE: 'expiryDate',
  QUANTITY: 'quantity',
  PRODUCT_CODE: 'productCode'
}

function createSignature(payload: any, secret: string) {
  const payloadString = JSON.stringify(payload)
  return crypto.createHmac('sha256', secret).update(payloadString).digest('hex')
}

export const publishToInventoryUploadServer = async (data: {
  fileUrl: string
  processId: string
  user: any
}) => {
  const { url: INVENTORY_SERVER_URL, secret: SHARED_SECRET } = appConfig?.inventoryServer ?? {}

  if (!INVENTORY_SERVER_URL) throw new Error('Inventory server URL missing!')

  await axios
    .post(`${INVENTORY_SERVER_URL}/api/inventory/sync`, data, {
      headers: {
        'X-Signature': createSignature(data, SHARED_SECRET),
        'Content-Type': 'application/json'
      }
    })
    .then((response) => {
      console.log('Response:', response.data)
    })
    .catch((error) => {
      console.error('Error:', error.response?.data || error.message)
    })
}

export function normalizeInventoryData(input: any[] | Record<string, any>[]): InventoryItem[] {
  const isExcel = Array.isArray(input[0]) // If rows are arrays, assume Excel
  const result: InventoryItem[] = []

  if (isExcel) {
    const [headerRow, ...dataRows] = input as any[][]
    const headers = headerRow.map((h: string) =>
      h?.toString()?.trim().toLowerCase().replace(/\s+/g, '_').replace('.', '')
    )

    for (const row of dataRows) {
      const obj: Record<string, any> = {}
      headers.forEach((key, index) => {
        if (key) obj[key] = (row[index] || '').toString().trim()
      })

      result.push({
        storeCode: obj.store_code || '',
        areaName: obj.area_name || '',
        date: obj.date || '',
        gstNo: obj.gst_no || '',
        state: obj.state || '',
        productCode: obj.product_code || '',
        productName: obj.product_name || '',
        genericName: obj.generic_name || '',
        productCategory: obj.product_category || '',
        packSize: obj.pack_size || '',
        batchNo: obj.batch_no || '',
        expiryDate: obj.expiry_date || '',
        quantity: obj.quantity || '',
        mrp: obj.mrp || '',
        purchaseRate: obj.purchase_rate || '',
        totalAmount: obj.total_amount || ''
      })
    }
  } else {
    for (const row of input as Record<string, any>[]) {
      result.push({
        storeCode: row.store_code || '',
        areaName: row.area_name || '',
        date: row.date || '',
        gstNo: row.gst_no || '',
        state: row.state || '',
        productCode: row.product_code || '',
        productName: row.product_name || '',
        genericName: row.generic_name || '',
        productCategory: row.product_category || '',
        packSize: row.pack_size || '',
        batchNo: row.batch_no || '',
        expiryDate: row.expiry_date || '',
        quantity: row.quantity || '',
        mrp: row.mrp || '',
        purchaseRate: row.purchase_rate || '',
        totalAmount: row.total_amount || ''
      })
    }
  }

  return result
}

function getWorkerExtension() {
  let fileExtension = ''
  const env = app.get('env')

  if (env === 'local') fileExtension = '.ts'
  return fileExtension
}

export const useWorkerToReadFile = async ({ filePath, objectUrl }: any, callback: (res: any) => void) => {
  try {
    // Using Worker threads to add extra core to perform this work
    const worker = new Worker(path.resolve(__dirname, '../worker/worker' + getWorkerExtension()), {
      workerData: {
        filePath,
        path: path.resolve(__dirname, '../worker/FileReaderWorker' + getWorkerExtension())
      }
    })

    // const buffer = fs.readFileSync(filePath)
    // const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) // Get ArrayBuffer

    // worker.postMessage(ab, [ab]) // Transfer buffer ownership

    const cleanUp = async () => {
      // Optional: dereference or terminate if needed
      try {
        await worker.terminate()
        console.log('Worker cleanup done!')
      } catch (err) {
        console.error('Error terminating worker:', err)
      }
      // Remove attachment
      try {
        await app.service('attachments').remove('', { query: { deleteUrl: objectUrl } })
      } catch (err) {
        console.error('Error deleting attachment:', err)
      }
    }

    worker.on('message', async ({ rows }) => {
      try {
        if (rows?.length > 0) {
          const normalized = normalizeInventoryData(rows)
          const grouped = groupInventoryByStore(normalized)
          callback(grouped)
        }
      } catch (err) {
        console.error('Error processing rows:', err)
      }
    })

    worker.on('error', async (err) => {
      console.error('Worker Error:', err)
      await cleanUp()
    })

    worker.on('exit', async (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`)
      } else {
        console.log('Worker finished processing successfully.')
      }

      await cleanUp()
    })
  } catch (e) {
    console.log(e)
  }
}

function groupInventoryByStore(records: InventoryItem[]): {
  storeWiseData: StoreInventoryMap
  columnMap: Record<string, string | number>
  totalRecords: number
} {
  const storeWiseInventoryData: StoreInventoryMap = {}

  if (records.length < 2) {
    return { storeWiseData: storeWiseInventoryData, columnMap: {}, totalRecords: 0 }
  }

  // Process data rows, skipping headers (assuming first row is headers)
  for (const row of records) {
    if (!row.storeCode) continue // Skip invalid rows

    if (!storeWiseInventoryData[row.storeCode]) {
      storeWiseInventoryData[row.storeCode] = []
    }

    storeWiseInventoryData[row.storeCode].push(row)
  }

  return { storeWiseData: storeWiseInventoryData, columnMap: {}, totalRecords: records.length }
}

export const handleProcessFileRecords = async (
  data: {
    storeWiseData: StoreInventoryMap
    columnMap: Record<string, string | number>
    totalRecords: number
  },
  { user, process }: any
) => {
  console.time('Time take to real records')
  const authorizedStoreIds = user?.storeIds
  // let errorsInFile: any[] = []

  // Step 2: Group By Store Code
  const { storeWiseData, totalRecords } = data
  const totalBatches = Object.keys(storeWiseData)?.length

  console.log('Step 2: Total Stores Inventory read: ' + totalBatches, totalRecords)

  // Step 3: Process Data once by one for store code

  const storeEntries = Object.entries(storeWiseData)

  const limit = promiseLimit(2)

  async function processInventory() {
    const totalTasks = storeEntries.length
    let completedTasks = 0

    // Map over storeEntries and limit the number of concurrent tasks
    const tasks = Array.from(storeEntries.entries()).map(([batchIndex, [storeCode, storeRecords]]) =>
      limit(async () => {
        console.log(`Processing batch ===> Store: ${storeCode}, Batch: ${batchIndex + 1}/${totalTasks}`)

        let inserted = 0,
          failed = 0

        try {
          const { validRows, errors, storeInventoryMap } = await readFileRecords(
            storeCode,
            storeRecords,
            authorizedStoreIds
          )

          const res = await processFileRecords({
            validRows,
            invalidRows: errors,
            process,
            user,
            totalBatches: totalTasks,
            currentBatch: batchIndex + 1,
            storeInventoryMap
          })

          inserted = res.inserted ?? 0
          failed = res.failed ?? 0
        } catch (error: any) {
          console.error(`Error processing store ${storeCode}:`, error)
        } finally {
          // Track and log progress
          completedTasks++
          const percent = (completedTasks / totalTasks) * 100
          console.log(
            `✅ Inventory upload Progress: ${completedTasks}/${totalTasks} (${Math.ceil(percent)}%)`
          )

          await BulkUploadProcessModel.updateOne(
            { _id: process?._id },
            {
              status: percent === 100 ? 'done' : 'in-progress',
              totalRecords: totalRecords,
              percentage: Math.ceil(percent),
              updatedAt: new Date().toISOString(),
              $inc: { insertedCount: inserted, failedCount: failed }
            }
          )
        }
      })
    )

    // Wait for all tasks to complete
    await Promise.all(tasks)
  }

  // Call the process function
  await processInventory().catch(console.error)

  console.timeEnd('Time take to real records')

  // Step 4: Store errors in Excel file and attach in process db
  // if (errorsInFile?.length) saveErrorsInFile(errors, process?._id?.toString())
}

// export async function readFileRecords(storeCode: string, dataRows: Array<any>, authorizedStoreIds: any) {
//   if (!dataRows.length) throw new Error('NO_DATA')

//   const requiredColumns = Object.values(BULK_UPLOAD_HEADERS)

//   const fileColumns = Object.keys(dataRows[0])

//   if (!requiredColumns.every((c) => fileColumns.includes(c))) {
//     throw new Error('INVALID_TEMPLATE')
//   }

//   // const validationErrors: Array<Record<string, any>> = []
//   const skus = new Set<string>()

//   dataRows.forEach((row: any, rowIndex) => {
//     const extractedData: Record<string, any> = {}
//     const { STORE_CODE, BATCH, EXPIRY_DATE, QUANTITY, PRODUCT_CODE } = BULK_UPLOAD_HEADERS

//     Object.entries(BULK_UPLOAD_HEADERS).forEach(([_, columnName]) => {
//       if ([STORE_CODE, BATCH, PRODUCT_CODE].includes(columnName))
//         extractedData[columnName] = '' + row[columnName]
//       else extractedData[columnName] = row[columnName]
//     })

//     if (extractedData[PRODUCT_CODE]) skus.add(String(extractedData[PRODUCT_CODE]))

//     // Perform validations
//     // validateData(
//     //   extractedData[STORE_CODE],
//     //   rowIndex,
//     //   BULK_UPLOAD_HEADERS.STORE_CODE,
//     //   validationErrors
//     // )
//     // validateData(
//     //   extractedData[BATCH],
//     //   rowIndex,
//     //   BULK_UPLOAD_HEADERS.BATCH,
//     //   validationErrors
//     // )
//     // validateData(
//     //   extractedData[EXPIRY_DATE],
//     //   rowIndex,
//     //   BULK_UPLOAD_HEADERS.EXPIRY_DATE,
//     //   validationErrors
//     // )
//     // validateData(
//     //   extractedData[QUANTITY],
//     //   rowIndex,
//     //   BULK_UPLOAD_HEADERS.QUANTITY,
//     //   validationErrors
//     // )
//     // validateData(
//     //   extractedData[PRODUCT_CODE],
//     //   rowIndex,
//     //   BULK_UPLOAD_HEADERS.PRODUCT_CODE,
//     //   validationErrors
//     // )
//   })

//   // Find stores that are available in system given in excel sheet
//   const storeFilter: any = {
//     storeCode: new RegExp(`^${storeCode}$`, 'i')
//   }

//   const authorizedStoreIdsStr: string[] = []

//   if (authorizedStoreIds) {
//     let storeIds: mongoose.Types.ObjectId[] = []
//     if (authorizedStoreIds.length) {
//       if (typeof authorizedStoreIds[0] === 'string') {
//         storeIds = authorizedStoreIds.map((sid: string) => new mongoose.Types.ObjectId(sid))
//         authorizedStoreIdsStr.push(...(authorizedStoreIds as string[]))
//       } else {
//         storeIds = authorizedStoreIds as mongoose.Types.ObjectId[]
//         authorizedStoreIdsStr.push(...authorizedStoreIds.map((sid: any) => sid.toString()))
//       }
//     }
//     storeFilter._id = { $in: storeIds }
//   }

//   // Fetch stores from DB and map them
//   const storeCodesFound = await StoreModel.find(storeFilter).select('_id storeCode').lean()

//   const storeCodeWiseStoreId = new Map(
//     storeCodesFound.map(({ storeCode, _id }) => [storeCode?.toLowerCase(), _id.toString()])
//   )

//   const availableStoreCodes = new Set(storeCodeWiseStoreId.keys())

//   // Fetch products from DB and map them
//   const productsFound = await ProductsModel.find({
//     sku: { $in: Array.from(skus).map((sku) => new RegExp(`^${escapeRegex(sku)}$`, 'i')) }
//   })
//     .select('_id sku')
//     .lean()

//   const skuWiseProductId = new Map(productsFound.map(({ sku, _id }) => [sku?.toLowerCase(), _id.toString()]))

//   const availableSKUs = new Set(skuWiseProductId.keys())

//   // Find unavailable store codes & SKUs
//   const unavailableStoreCodes = availableStoreCodes.has(storeCode?.toLowerCase())
//     ? new Set()
//     : new Set([storeCode])

//   const unavailableSKUs = new Set(Array.from(skus).filter((sku) => !availableSKUs.has(sku?.toLowerCase())))

//   // Function to add validation errors
//   // const addValidationError = (unavailableItems: string[], column: string, errorMessage: string) => {
//   //   unavailableItems.forEach((item) => {
//   //     dataRows
//   //       .filter((row) => `${row[columnMap[column]]}`?.toLowerCase() === item?.toLowerCase())
//   //       .forEach((row) => {
//   //         let vError = validationErrors.find((e) => e.rowIndex === row.index)

//   //         if (!vError) {
//   //           let error: any = {}
//   //           error[columnMap[column]] = errorMessage
//   //           validationErrors.push({ ...row, error })
//   //         }

//   //         if (vError && !vError?.error[columnMap[column]]) vError.error[columnMap[column]] = errorMessage
//   //       })
//   //   })
//   // }

//   // // Add validation errors for missing store codes & SKUs
//   // addValidationError(
//   //   Array.from(unavailableStoreCodes) as string[],
//   //   BULK_UPLOAD_HEADERS.STORE_CODE,
//   //   'Invalid store code provided'
//   // )
//   // addValidationError(
//   //   Array.from(unavailableSKUs) as string[],
//   //   BULK_UPLOAD_HEADERS.PRODUCT_CODE,
//   //   'Invalid product code provided'
//   // )

//   // Build store inventory filter for valid store-product combinations
//   const storeInventoryFilter = dataRows.reduce((acc, row) => {
//     const storeCode = `${row[BULK_UPLOAD_HEADERS.STORE_CODE]}`?.toLowerCase()
//     const sku = `${row[BULK_UPLOAD_HEADERS.PRODUCT_CODE]}`?.toLowerCase()

//     if (availableStoreCodes.has(storeCode) && availableSKUs.has(sku)) {
//       acc.push({
//         storeId: new mongoose.Types.ObjectId(storeCodeWiseStoreId.get(storeCode)),
//         productId: new mongoose.Types.ObjectId(skuWiseProductId.get(sku))
//       })
//     }

//     return acc
//   }, [])

//   // Fetch store inventory if storeInventoryFilter has data
//   const storeInventory = storeInventoryFilter.length
//     ? await StoreInventoryModel.find({ $or: storeInventoryFilter })
//         .select('_id storeId productId stock batches')
//         .lean()
//     : []

//   // Convert storeInventory array into a Map for faster lookups
//   const storeInventoryMap = new Map(
//     storeInventory.map((inv) => [`${inv.storeId.toString()}-${inv.productId.toString()}`, inv])
//   )

//   const createPayload = (row: any, appendError: boolean = false) => {
//     const storeCode = `${row[BULK_UPLOAD_HEADERS.STORE_CODE] ?? ''}`?.toLowerCase()
//     const productCode = `${row[BULK_UPLOAD_HEADERS.PRODUCT_CODE]}`?.toLowerCase()
//     const batchNo = `${row[BULK_UPLOAD_HEADERS.BATCH]}`?.toLowerCase()

//     const storeId = storeCodeWiseStoreId.get(storeCode)
//     const productId = skuWiseProductId.get(productCode)
//     const inventoryKey = storeId && productId ? `${storeId}-${productId}` : null
//     const inventory = inventoryKey ? storeInventoryMap.get(inventoryKey) : null

//     let batchStock = 0
//     if (inventory) {
//       const batch = inventory.batches?.find((b: any) => b.batchNo?.toLowerCase() === batchNo)
//       batchStock = batch?.stock || 0
//     }

//     const updatedRow: any = {
//       storeCode,
//       batchNo,
//       expiryDate: getDateObjectFromField(row[BULK_UPLOAD_HEADERS.EXPIRY_DATE]),
//       quantity: row[BULK_UPLOAD_HEADERS.QUANTITY],
//       sku: productCode,
//       inventoryId: inventory?._id?.toString() || null,
//       storeId: storeId || null,
//       productId: productId || null,
//       stock: inventory?.stock || 0,
//       batchStock,
//       batchNetStock: batchStock + (row[BULK_UPLOAD_HEADERS.QUANTITY] || 0)
//     }

//     // Attach validation errors if any exist
//     if (appendError) updatedRow['Error Reason'] = Object.values(row.error ?? {})[0] ?? ''

//     return updatedRow
//   }

//   const validRows = dataRows.reduce((acc, row) => {
//     const storeCode = `${row[BULK_UPLOAD_HEADERS.STORE_CODE]}`?.toLowerCase()
//     const productCode = `${row[BULK_UPLOAD_HEADERS.PRODUCT_CODE]}`?.toLowerCase()
//     const storeId = storeCodeWiseStoreId.get(storeCode) as string

//     const isAuthorized = authorizedStoreIds ? authorizedStoreIdsStr.includes(storeId) : true
//     const isStoreAvailable = !unavailableStoreCodes.has(storeCode)
//     const isSkuAvailable = !unavailableSKUs.has(productCode)

//     if (isAuthorized && isStoreAvailable && isSkuAvailable) {
//       acc.push(createPayload(row))
//     }

//     return acc
//   }, [])

//   // Process data rows and enrich with additional data
//   return {
//     validRows,
//     errors: [],
//     // errors: validationErrors.map((err) => createPayload(err, true)),
//     storeInventoryMap
//   }
// }

export async function readFileRecords(storeCode: string, dataRows: Array<any>, authorizedStoreIds: any) {
  if (!dataRows.length) throw new Error('NO_DATA')

  const requiredColumns = Object.values(BULK_UPLOAD_HEADERS)
  const fileColumns = Object.keys(dataRows[0])
  if (!requiredColumns.every((c) => fileColumns.includes(c))) throw new Error('INVALID_TEMPLATE')

  const skus = new Set<string>()
  const storeCodes = new Set<string>()

  const lowerCasedDataRows = dataRows.map((row) => {
    const lowerRow: any = {}
    for (const [key, col] of Object.entries(BULK_UPLOAD_HEADERS)) {
      const val = row[col]
      lowerRow[col] = typeof val === 'string' ? val.trim() : val
      if (
        [
          BULK_UPLOAD_HEADERS.STORE_CODE,
          BULK_UPLOAD_HEADERS.BATCH,
          BULK_UPLOAD_HEADERS.PRODUCT_CODE
        ].includes(col)
      ) {
        lowerRow[col] = String(lowerRow[col] || '').toLowerCase()
      }
    }

    if (lowerRow[BULK_UPLOAD_HEADERS.PRODUCT_CODE]) skus.add(lowerRow[BULK_UPLOAD_HEADERS.PRODUCT_CODE])
    if (lowerRow[BULK_UPLOAD_HEADERS.STORE_CODE]) storeCodes.add(lowerRow[BULK_UPLOAD_HEADERS.STORE_CODE])

    return lowerRow
  })

  // Handle authorized store IDs
  const authorizedStoreIdsStr: string[] = []
  let storeIds: mongoose.Types.ObjectId[] = []

  if (authorizedStoreIds?.length) {
    if (typeof authorizedStoreIds[0] === 'string') {
      storeIds = authorizedStoreIds.map((id: string) => new mongoose.Types.ObjectId(id))
      authorizedStoreIdsStr.push(...authorizedStoreIds)
    } else {
      storeIds = authorizedStoreIds
      authorizedStoreIdsStr.push(...authorizedStoreIds.map((sid: any) => sid.toString()))
    }
  }

  const storeFilter: any = {
    storeCode: new RegExp(`^${storeCode}$`, 'i')
  }
  if (storeIds.length) {
    storeFilter._id = { $in: storeIds }
  }

  const storeCodesFound = await StoreModel.find(storeFilter).select('_id storeCode').lean()
  const storeCodeWiseStoreId = new Map<string, string>(
    storeCodesFound.map(({ storeCode, _id }) => [storeCode?.toLowerCase(), _id.toString()])
  )
  const availableStoreCodes = new Set(storeCodeWiseStoreId.keys())

  const productsFound = await ProductsModel.find({
    sku: { $in: Array.from(skus).map((sku) => sku.toLowerCase()) }
  })
    .select('_id sku')
    .lean()

  const skuWiseProductId = new Map<string, string>(
    productsFound.map(({ sku, _id }) => [sku?.toLowerCase(), _id.toString()])
  )
  const availableSKUs = new Set(skuWiseProductId.keys())

  const unavailableStoreCodes = availableStoreCodes.has(storeCode.toLowerCase())
    ? new Set()
    : new Set([storeCode])
  const unavailableSKUs = new Set(Array.from(skus).filter((sku) => !availableSKUs.has(sku?.toLowerCase())))

  // Build store-inventory filter in one go
  const storeInventoryFilter: any[] = []
  lowerCasedDataRows.forEach((row) => {
    const sc = row[BULK_UPLOAD_HEADERS.STORE_CODE]
    const sku = row[BULK_UPLOAD_HEADERS.PRODUCT_CODE]
    if (availableStoreCodes.has(sc) && availableSKUs.has(sku)) {
      storeInventoryFilter.push({
        storeId: new mongoose.Types.ObjectId(storeCodeWiseStoreId.get(sc)),
        productId: new mongoose.Types.ObjectId(skuWiseProductId.get(sku))
      })
    }
  })

  const storeInventory = storeInventoryFilter.length
    ? await StoreInventoryModel.find({ $or: storeInventoryFilter })
        .select('_id storeId productId stock batches')
        .lean()
    : []

  const storeInventoryMap = new Map(
    storeInventory.map((inv) => [`${inv.storeId.toString()}-${inv.productId.toString()}`, inv])
  )

  const validRows: any[] = []
  for (const row of lowerCasedDataRows) {
    const storeCode = row[BULK_UPLOAD_HEADERS.STORE_CODE]
    const productCode = row[BULK_UPLOAD_HEADERS.PRODUCT_CODE]
    const batchNo = row[BULK_UPLOAD_HEADERS.BATCH]

    const storeId = storeCodeWiseStoreId.get(storeCode) ?? ''
    const productId = skuWiseProductId.get(productCode)

    const isAuthorized = authorizedStoreIds ? authorizedStoreIdsStr.includes(storeId) : true
    const isStoreAvailable = !unavailableStoreCodes.has(storeCode)
    const isSkuAvailable = !unavailableSKUs.has(productCode)

    if (isAuthorized && isStoreAvailable && isSkuAvailable) {
      const inventoryKey = storeId && productId ? `${storeId}-${productId}` : null
      const inventory = inventoryKey ? storeInventoryMap.get(inventoryKey) : null
      let batchStock = 0

      if (inventory) {
        const batch = inventory.batches?.find((b: any) => b.batchNo?.toLowerCase() === batchNo)
        batchStock = batch?.stock || 0
      }

      validRows.push({
        storeCode,
        batchNo,
        expiryDate: getDateObjectFromField(row[BULK_UPLOAD_HEADERS.EXPIRY_DATE]),
        quantity: row[BULK_UPLOAD_HEADERS.QUANTITY],
        sku: productCode,
        inventoryId: inventory?._id?.toString() || null,
        storeId,
        productId,
        stock: inventory?.stock || 0,
        batchStock,
        batchNetStock: batchStock + (row[BULK_UPLOAD_HEADERS.QUANTITY] || 0)
      })
    }
  }

  return {
    validRows,
    errors: [],
    storeInventoryMap
  }
}

export async function processFileRecords({ validRows, user, storeInventoryMap }: any) {
  const { inserted, failed }: any = await insertInventoryBulkUploadData({
    rows: validRows ?? [],
    updatedBy: user._id.toString(),
    storeInventoryMap
  })

  return { inserted, failed }
}

// async function saveErrorsInFile(errors: Array<any>, processId: any) {
//   try {
//     const uploadDir = path.join('public', 'inventory-errors')
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true })
//     }

//     const directoryPath = `public/inventory-errors/${processId}-inventory-upload-errors.xlsx`

//     const filePath: string = `${app.get('deployment')?.api_public_url}/${directoryPath.replace('public/', '')}`

//     // Convert JSON data to a worksheet
//     const worksheet = XLSX.utils.json_to_sheet(errors)

//     // Create a new workbook and append the worksheet
//     const workbook = XLSX.utils.book_new()
//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Upload Errors')

//     // Write the file
//     XLSX.writeFile(workbook, directoryPath)

//     console.log(`Excel file saved as: ${filePath}`)

//     await BulkUploadProcessModel.updateOne({ _id: processId }, { $set: { errorFilePath: filePath } })
//   } catch (e) {
//     console.log('Error while saving Excel file', e)
//   }
// }

// function validateData(value: any, rowIndex: any, columnName: any, errors: any[]) {
//   const errorIdx = errors.findIndex((e) => e.rowIndex === rowIndex)
//   const error: any = errorIdx === -1 ? { rowIndex } : errors[errorIdx]

//   if (columnName === BULK_UPLOAD_HEADERS.STORE_CODE)
//     if (!value) error[columnName] = 'Store code must be provided'

//   if (columnName === BULK_UPLOAD_HEADERS.BATCH) if (!value) error[columnName] = 'Batch no must be provided'

//   if (columnName === BULK_UPLOAD_HEADERS.EXPIRY_DATE) {
//     if (!value) error[columnName] = 'Expiry date must be provided'
//     else if (typeof value === 'number')
//       if (!value) error[columnName] = 'Expiry date must be provided'
//       else if (typeof value === 'string' && !/^\d{2}-\d{2}-\d{4}$/.test(value))
//         error[columnName] = 'Expiry date must be in format DD-MM-YYYY'
//   }
//   if (columnName === BULK_UPLOAD_HEADERS.QUANTITY) {
//     if (typeof value !== 'number' || isNaN(value)) error[columnName] = 'Quantity must be number'
//     else if (value < 0) error[columnName] = 'Quantity must be more than 0'
//   }
//   if (columnName === BULK_UPLOAD_HEADERS.PRODUCT_CODE)
//     if (!value) error[columnName] = 'Product code must be provided'

//   if (Object.keys(error).length > 1 && errorIdx === -1) errors.push(error)
// }

// export async function insertInventoryBulkUploadData({
//   rows,
//   updatedBy,
// }: {
//   rows: InventoryRowRec[]
//   updatedBy: string
//   storeInventoryMap: any
// }) {
//   if (!rows.length) return { inserted: 0, failed: 0 }

//   const storeWiseInventory: StoreInventoryMapNew = new Map()
//   let inserted = 0
//   let failed = 0

//   for (const inventory of rows) {
//     const { storeId, productId, expiryDate, quantity, batchNo, inventoryId, batchStock } = inventory
//     try {
//       // let invId = inventoryId
//       // if (!invId) {
//       //   // const existingInventory = await StoreInventoryModel.findOne({ storeId, productId })
//       //   //   .select('_id')
//       //   //   .lean()
//       //   const inventoryKey = storeId && productId ? `${storeId}-${productId}` : null
//       //   const existingInventory = inventoryKey ? storeInventoryMap.get(inventoryKey) : null

//       //   invId = existingInventory?._id?.toString()

//       //   if (!invId) {
//       //     const newInventory: any = await StoreInventoryModel.create({
//       //       storeId: new mongoose.Types.ObjectId(storeId),
//       //       productId: new mongoose.Types.ObjectId(productId),
//       //       stock: 0,
//       //       batches: [],
//       //       softHoldCount: 0,
//       //       softHoldForOrderCount: 0,
//       //       createdBy: new mongoose.Types.ObjectId(updatedBy)
//       //     })
//       //     invId = newInventory._id.toString()
//       //   }
//       //   inventory.inventoryId = invId
//       // }

//       const operation = quantity > batchStock ? 'add' : 'remove'
//       const quantityDiff = Math.abs(quantity - batchStock)

//       if (quantityDiff > 0) {
//         try {
//           await addInventoryStockEntry({
//             storeId,
//             productId,
//             operation,
//             quantity: quantityDiff,
//             reason: 'Bulk upload update',
//             updatedBy,
//             batchNo,
//             expiryDate
//           })
//           inserted++
//         } catch (error) {
//           // console.error(
//           //   `Failed to update stock for store: ${storeId}, product: ${productId}, batch: ${batchNo}`,
//           //   error
//           // )
//           failed++
//         }
//       }

//       if (storeId && productId) {
//         if (!storeWiseInventory.has(storeId)) storeWiseInventory.set(storeId, new Map())
//         const productMap = storeWiseInventory.get(storeId)!
//         if (!productMap.has(productId)) productMap.set(productId, new Map())
//       }

//       // const batchMap = productMap.get(productId)!
//       // batchMap.set(batchNo?.toLowerCase(), { batchNo, stock: quantity })
//     } catch (error) {
//       // console.error(`Error processing inventory for store: ${storeId}, product: ${productId}`, error)
//       failed++
//     }
//   }

//   const storeIds = Array.from(storeWiseInventory.keys())
//   const storeInventories: any[] = await StoreInventoryModel.find({
//     storeId: { $in: storeIds.map((id) => new mongoose.Types.ObjectId(id)) }
//   }).lean()

//   for (const inventory of storeInventories) {
//     const { storeId, productId, batches = [] } = inventory
//     const currentBatchNos = new Set(batches.map((b: any) => b.batchNo?.toLowerCase()))
//     const batchMap = storeWiseInventory.get(storeId.toString())?.get(productId.toString()) || new Map()

//     const batchNosToRemove: any[] = [...currentBatchNos].filter((bNo) => !batchMap.has(bNo))

//     for (const batchNo of batchNosToRemove) {
//       const batch = batches.find((b: any) => b.batchNo?.toLowerCase() === batchNo)
//       if (batch) {
//         try {
//           await addInventoryStockEntry({
//             storeId,
//             productId,
//             operation: 'remove',
//             quantity: batch.stock,
//             reason: 'Bulk upload update',
//             updatedBy,
//             batchNo
//           })
//         } catch (error) {
//           // console.error(
//           //   `Failed to remove batch: ${batchNo} for store: ${storeId}, product: ${productId}`,
//           //   error
//           // )
//         }
//       }
//     }
//   }

//   return { inserted, failed }
// }

export async function insertInventoryBulkUploadData({
  rows,
  updatedBy
}: {
  rows: InventoryRowRec[]
  updatedBy: string
  storeInventoryMap: Map<string, any>
}) {
  if (!rows.length) return { inserted: 0, failed: 0 }

  const storeWiseInventory: Map<string, Set<string>> = new Map() // storeId -> Set of productIds
  let inserted = 0
  let failed = 0

  for (const { storeId, productId, expiryDate, quantity, batchNo, batchStock } of rows) {
    const quantityDiff = Math.abs(quantity - batchStock)
    const operation = quantity > batchStock ? 'add' : 'remove'

    if (quantityDiff > 0) {
      try {
        await addInventoryStockEntry({
          storeId,
          productId,
          operation,
          quantity: quantityDiff,
          reason: 'Bulk upload update',
          updatedBy,
          batchNo,
          expiryDate,
          isFromUpload: true
        })
        inserted++
      } catch {
        failed++
      }
    }

    // Track storeId → productId mapping
    if (storeId && productId) {
      if (!storeWiseInventory.has(storeId)) storeWiseInventory.set(storeId, new Set())
      storeWiseInventory.get(storeId)!.add(productId)
    }
  }

  // Fetch all impacted store inventories
  const storeIds = Array.from(storeWiseInventory.keys())

  const storeInventories: any[] = await StoreInventoryModel.find({
    storeId: { $in: storeIds.map((id) => new mongoose.Types.ObjectId(id)) }
  }).lean()

  for (const { storeId, productId, batches = [] } of storeInventories) {
    const affectedProducts = storeWiseInventory.get(storeId.toString())
    if (!batches.length || !affectedProducts || !affectedProducts.has(productId.toString())) continue

    // Clean up unused batches
    for (const b of batches) {
      const bNo = b.batchNo?.toLowerCase()
      if (!bNo) continue

      const match = rows.find(
        (r) =>
          r.storeId === storeId.toString() &&
          r.productId === productId.toString() &&
          r.batchNo?.toLowerCase() === bNo
      )

      if (!match) {
        try {
          await addInventoryStockEntry({
            storeId,
            productId,
            operation: 'remove',
            quantity: b.stock,
            reason: 'Bulk upload update',
            updatedBy,
            batchNo: b.batchNo,
            isFromUpload: true
          })
        } catch {
          // silently fail
        }
      }
    }
  }

  return { inserted, failed }
}

// function escapeRegex(input: string): string {
//   return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape all special characters
// }

const getDateObjectFromField = (val: any): Date => {
  if (val instanceof Date) return val
  if (typeof val === 'number') return excelDateToJSDate(val)
  return moment(val, 'DD-MM-YYYY', 'Asia/Kolkata').toDate()
}

function excelDateToJSDate(serial: number) {
  const excelEpoch = new Date(1900, 0, 1) // Excel's epoch date (1 Jan 1900)
  const daysOffset = serial - 2 // Subtract 2 to account for leap year bug and 1-based index
  const msPerDay = 86400000 // Milliseconds in a day
  return new Date(excelEpoch.getTime() + daysOffset * msPerDay)
}
