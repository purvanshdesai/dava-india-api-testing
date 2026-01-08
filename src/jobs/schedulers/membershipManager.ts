// scheduler.js
import { Queue } from 'bullmq'
import { MEMBERSHIP_MANAGER_QUEUE } from '../constants'
import { redisConfig } from '../../utils/config'

// Create the queue
const scheduleQueue = new Queue(MEMBERSHIP_MANAGER_QUEUE, { connection: redisConfig })

async function removeExistingJob(): Promise<string> {
  return new Promise(async (resolve) => {
    await scheduleQueue.drain() // waiting + delayed
    await scheduleQueue.clean(0, 10000, 'completed') // completed jobs
    await scheduleQueue.clean(0, 10000, 'failed') // failed jobs
    await scheduleQueue.clean(0, 10000, 'active') // active jobs, just in case

    const repeatables = await scheduleQueue.getRepeatableJobs()

    for (const job of repeatables) {
      await scheduleQueue.removeRepeatableByKey(job.key)
    }

    setTimeout(() => {
      resolve('Removed existing job after delay')
    }, 1000)
  })
}

// Add a repeatable job
async function scheduleJob() {
  await scheduleQueue.add(
    'membership-every-day-job',
    { message: 'Running scheduled job' },
    {
      repeat: {
        // every: 30000
        // Cron expression for every day at 12AM
        pattern: '0 0 * * *'
      },
      removeOnComplete: true,
      removeOnFail: true
    }
  )

  // await listRepeatableJobs()
}

// async function listRepeatableJobs() {
//   const repeatJobs = await scheduleQueue.getRepeatableJobs()

//   console.log('Total repeatable jobs: ', repeatJobs.length)

//   repeatJobs.forEach((job) => {
//     console.log(`Repeatable Job:`, job)
//   })
// }

removeExistingJob().then(() => {
  scheduleJob()
})
