import { Worker } from 'bullmq'
import { ORDER_CHECKOUT_SESSION_QUEUE } from '../constants'
import { redisConfig } from '../../utils/config'
import { CheckoutSessionModel } from '../../services/order/order.schema'
import { releaseSoftHoldQuantity } from '../../utils/inventory'
import { checkPaymentStatusAfterCheckoutSessionEnd } from '../../payments/utils'

// Define worker to process 'myJobQueue' jobs
const checkoutSessionWorker = new Worker(
  ORDER_CHECKOUT_SESSION_QUEUE,
  async (job) => {
    // Job logic goes here
    const { orderId } = job.data
    // console.log('running soft hold release job queue ----- order id ', orderId)
    const checkoutSession = await CheckoutSessionModel.findOne({ orderId }).lean()
    if (!checkoutSession || checkoutSession.status === 'inactive') return

    await Promise.allSettled([
      releaseSoftHoldQuantity(orderId),
      checkPaymentStatusAfterCheckoutSessionEnd(orderId)
    ])

    return 'Job completed'
  },
  { connection: redisConfig }
)

// Handle worker events
checkoutSessionWorker.on('completed', (job: any) => {
  console.log(`Job ${job.id} completed successfully`)
})

checkoutSessionWorker.on('failed', (job: any, err) => {
  console.log(`Job ${job.id} failed: ${err.message}`)
})

export default checkoutSessionWorker
