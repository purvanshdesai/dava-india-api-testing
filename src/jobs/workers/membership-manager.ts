import { Worker } from 'bullmq'
import { MEMBERSHIP_MANAGER_QUEUE } from '../constants'
import { redisConfig } from '../../utils/config'
import { handleExpiredMemberships } from '../../services/memberships/utils'

// Define worker to process 'myJobQueue' jobs
const worker = new Worker(
  MEMBERSHIP_MANAGER_QUEUE,
  async (_job) => {
    // Job logic goes here
    await handleExpiredMemberships()

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
