import { Worker } from 'bullmq'
import { REFUND_PAYMENT_PROCESSED_QUEUE } from '../constants'
import { redisConfig } from '../../utils/config'
import { onPaymentRefundProcessed } from '../../payments/utils'

// Define worker to process 'myJobQueue' jobs
const worker = new Worker(
  REFUND_PAYMENT_PROCESSED_QUEUE,
  async (job) => {
    // Job logic goes here

    await onPaymentRefundProcessed(job?.data)

    // await new Promise((resolve) => setTimeout(resolve, 1000))
    return 'Job completed'
  },
  { connection: redisConfig }
)

// Handle worker events
worker.on('completed', (job: any) => {
  console.log(`Refund Payment Job ${job.id} completed successfully`)
})

worker.on('failed', (job: any, err) => {
  console.log(`Refund Payment Job ${job.id} failed: ${err.message}`)
})

export default worker
