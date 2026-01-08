import { Queue } from 'bullmq'
import { redisConfig } from '../../utils/config'
import {
  QUEUE_NAME,
  CALLBACK_QUEUE_NAME,
  ORDER_CHECKOUT_SESSION_QUEUE,
  BULK_UPLOAD_QUEUE,
  REFUND_PAYMENT_PROCESSED_QUEUE,
  ORDER_PROCESSING_QUEUE,
  PRESCRIPTION_GENERATION,
  MEDICINE_REMAINDER_STOCK_NOTIFICATION_QUEUE,
  ORDER_CHECKOUT_SESSION_TIMEOUT
} from '../constants'

// Initialize queues
const queue = new Queue(QUEUE_NAME, { connection: redisConfig })
const callbackQueue = new Queue(CALLBACK_QUEUE_NAME, { connection: redisConfig })
const orderCheckoutSessionQueue = new Queue(ORDER_CHECKOUT_SESSION_QUEUE, { connection: redisConfig })
const bulkUploadQueue = new Queue(BULK_UPLOAD_QUEUE, { connection: redisConfig })
const refundPaymentQueue = new Queue(REFUND_PAYMENT_PROCESSED_QUEUE, { connection: redisConfig })
const orderProcessingQueue = new Queue(ORDER_PROCESSING_QUEUE, { connection: redisConfig })
const prescriptionGenerationQueue = new Queue(PRESCRIPTION_GENERATION, { connection: redisConfig })
const medicineRemainderStockNotificationQueue = new Queue(MEDICINE_REMAINDER_STOCK_NOTIFICATION_QUEUE, {
  connection: redisConfig
})

// Add job to queue (helper function)
async function addToQueue(data: any) {
  await queue.add('jobQueue', data, {
    delay: 1000, // Optionally delay the job
    attempts: 3 // Retry up to 3 times on failure
  })
}

// Add job to queue (helper function)
async function addToCallbackQueue(data: any) {
  await callbackQueue.add('callbackQueue', data, {
    delay: 1000, // Optionally delay the job
    attempts: 3 // Retry up to 3 times on failure
  })
}

// Add job to medicine remainder stock notification queue (helper function)
async function addToMedicineRemainderStockNotificationQueue(data: any) {
  await medicineRemainderStockNotificationQueue.add('medicineRemainderStockNotification', data, {
    delay: 2000, // Delay to ensure stock update is complete
    attempts: 3 // Retry up to 3 times on failure
  })
}

async function addToOrderCheckoutSessionQueue(data: any) {
  console.log('🚀 ~ Adding checkout session to queue ==================>')
  await orderCheckoutSessionQueue.add('orderCheckoutSessionQueue', data, {
    delay: ORDER_CHECKOUT_SESSION_TIMEOUT, // Optionally delay the job
    attempts: 3, // Retry up to 3 times on failure
    removeOnFail: true,
    removeOnComplete: true
  })
}

async function addToBulkUploadFillProcessQueue(data: any) {
  console.log('Adding to bulk upload file process queue ==================')
  await bulkUploadQueue.add('inventoryUploadQueue', data, {
    delay: 1000, // Optionally delay the job
    attempts: 3, // Retry up to 3 times on failure
    removeOnFail: true,
    removeOnComplete: true
  })
}

async function addToFileTransferQueue(records: any) {
  await queue.add(
    'fileTransferQueue',
    { type: 'file-transfer', records },
    {
      delay: 1000, // Optionally delay the job
      attempts: 3 // Retry up to 3 times on failure
    }
  )
}

async function addToRefundPaymentProcessedQueue(data: any) {
  await refundPaymentQueue.add(
    'refundPaymentProcessedQueue',
    { ...data },
    {
      delay: 3000, // Optionally delay the job
      attempts: 3 // Retry up to 3 times on failure
    }
  )
}
async function addToOrderProcessingQueue(data: any) {
  try {
    await orderProcessingQueue.add(
      'orderProcessingQueue',
      { ...data },
      {
        delay: 30000, // Optionally delay the job
        attempts: 3 // Retry up to 3 times on failure
      }
    )
  } catch (error) {
    console.log('adding error', error)
  }
}
async function addToOrderForPrescriptionQueue(data: any) {
  try {
    await prescriptionGenerationQueue.add(
      'prescriptionGenerationQueue',
      { ...data },
      {
        delay: 40000, // Optionally delay the job
        attempts: 3 // Retry up to 3 times on failure
      }
    )
  } catch (error) {
    console.log('adding error', error)
  }
}

export {
  queue,
  addToQueue,
  addToCallbackQueue,
  addToOrderCheckoutSessionQueue,
  addToBulkUploadFillProcessQueue,
  addToFileTransferQueue,
  addToRefundPaymentProcessedQueue,
  addToOrderProcessingQueue,
  addToOrderForPrescriptionQueue,
  medicineRemainderStockNotificationQueue,
  addToMedicineRemainderStockNotificationQueue
}
