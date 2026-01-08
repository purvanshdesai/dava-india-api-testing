import { Worker } from 'bullmq'
import { QUEUE_NAME } from '../constants'
import { redisConfig } from '../../utils/config'
import { app } from '../../app'

// Define worker to process 'myJobQueue' jobs
const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    // Job logic goes here

    const { type, records } = job?.data

    if (type === 'file-transfer') {
      console.log('file transfer', records.length)
      await app.service('file-transfer').startTransferFiles(records)
    }

    // await new Promise((resolve) => setTimeout(resolve, 1000))
    return 'Job completed'
  },
  { connection: redisConfig }
)

// Handle worker events
worker.on('completed', (job: any) => {
  console.log(`Job ${job.id} completed successfully`)
})

worker.on('failed', (job: any, err) => {
  console.log(`Job ${job.id} failed: ${err.message}`)
})

export default worker
