import { Worker } from 'bullmq'
import { ORDER_PROCESSING_QUEUE } from '../constants'
import { redisConfig } from '../../utils/config'

import { OrderItemTrackingModal } from '../../services/order-item-tracking/order-item-tracking.schema'

// Define worker to process 'myJobQueue' jobs
const worker = new Worker(
  ORDER_PROCESSING_QUEUE,
  async (job) => {
    // Job logic goes here

    const { trackingId, statusToSet = 'order_under_verification' } = job.data

    // Example: optionally update tracking timeline with 'order_under_verification'
    const tracking = await OrderItemTrackingModal.findById(trackingId)
    if (!tracking) throw new Error('Order Items tracking not found!')

    if (tracking) {
      const timeline: any = tracking?.timeline || []
      timeline.push({
        authorType: 'super-admin',
        authorName: 'Super Admin (System)',
        label: 'Order Under Verification',
        date: new Date(),
        statusCode: statusToSet
      })

      await OrderItemTrackingModal.findByIdAndUpdate(trackingId, {
        timeline,
        lastTimelineStatus: statusToSet
      })
    }
    return 'Job completed'
  },
  { connection: redisConfig }
)

// Handle worker events
worker.on('completed', (job: any) => {
  console.log(`Scheduler Job ${job.id} completed successfully`)
})

worker.on('failed', (job: any, err) => {
  console.log(`Scheduler Job ${job.id} failed: ${err.message}`)
})

export default worker
