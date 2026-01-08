import { Worker } from 'bullmq'
import { PRESCRIPTION_GENERATION } from '../constants'
import { redisConfig } from '../../utils/config'
import { OrderItemTrackingModal } from '../../services/order-item-tracking/order-item-tracking.schema'
import { AppDataModel, CONSTANTS } from '../../services/app-data/app-data.schema'

// Define worker to process 'myJobQueue' jobs
const worker = new Worker(
  PRESCRIPTION_GENERATION,
  async (job) => {
    const { trackingIds } = job.data

    const prescriptionUnderProcess = await AppDataModel.findOne({
      type: CONSTANTS.TYPE.TRACKING_STATUS,
      statusCode: 'prescription_being_generated'
    })

    for (const trackingId of trackingIds || []) {
      const tracking = await OrderItemTrackingModal.findById(trackingId).lean()
      if (!tracking) continue

      const timeline = tracking.timeline || []

      timeline.push({
        label: prescriptionUnderProcess?.name,
        date: new Date(),
        statusCode: prescriptionUnderProcess?.statusCode,
        authorName: 'Super Admin (System)',
        authorType: 'super-admin'
      })

      await OrderItemTrackingModal.findByIdAndUpdate(trackingId, {
        timeline,
        lastTimelineStatus: prescriptionUnderProcess?.statusCode
      })
    }
    return 'Job completed'
  },
  { connection: redisConfig }
)

// Handle worker events
worker.on('completed', (job: any) => {
  console.log(`Scheduler Job ${job.id} completed successfully prescription`)
})

worker.on('failed', (job: any, err) => {
  console.log(`Scheduler Job ${job.id} prescription failed: ${err.message}`)
})

export default worker
