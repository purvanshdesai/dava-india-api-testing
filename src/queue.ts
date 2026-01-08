import { Queue, Worker } from 'bullmq'
import { redisConfig } from './utils/config'

export const queueTest = new Queue('tester', { connection: redisConfig })

const worker = new Worker(
  'tester',
  async (job) => {
    console.log('Queue execute ', job.data)
  },
  { connection: redisConfig }
)
