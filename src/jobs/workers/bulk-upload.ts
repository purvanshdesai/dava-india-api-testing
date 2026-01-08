import { Worker } from 'bullmq'
import { BULK_UPLOAD_QUEUE } from '../constants'
import { redisConfig } from '../../utils/config'
import {
  readUploadedInventoryFile,
  processUploadedInventoryRecords
} from '../../services/bulk-upload/inventory-bulk-upload/inventory-bulk-upload.shared'

// Define worker to process 'myJobQueue' jobs
const worker = new Worker(
  BULK_UPLOAD_QUEUE,
  async (job) => {
    // Job logic goes here

    await processUploadFile(job)

    return 'Job completed'
  },
  { connection: redisConfig }
)

// Handle worker events
worker.on('completed', (job: any) => {
  console.log(`Bulk upload Job ${job.id} completed successfully`)
})

worker.on('failed', (job: any, err) => {
  console.log(`Bulk upload Job ${job.id} failed: ${err.message}`)
})

const processUploadFile = async (job: any) => {
  try {
    if (!job?.data) return
    const { data, params } = job?.data ?? {}
    await readUploadedInventoryFile(data).then(async (res) => {
      await processUploadedInventoryRecords(res, params)
    })
  } catch (e) {
    console.log(e)
  }
}

export default worker
