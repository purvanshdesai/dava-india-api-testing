import { Worker } from 'bullmq'
import { redisConfig } from '../../utils/config'
import { MEDICINE_REMAINDER_STOCK_NOTIFICATION_QUEUE } from '../constants'
import { MedicineRemainderModel } from '../../services/medicine-remainder/medicine-remainder.schema'
import { DeliveryPoliciesModel } from '../../services/delivery-policies/delivery-policies.schema'
import { StoreInventoryModel } from '../../services/store-inventory/store-inventory.schema'
import { UsersModel } from '../../services/users/users.schema'
import { ObjectId } from 'mongodb'
import clevertapProvider from '../../analytics/providers/clevertap'
import { ProductsModel } from '../../services/super-admin/products/products.schema'
import { trackMedicineRemainder } from '../../analytics/trackers'

interface MedicineRemainderStockNotificationJobData {
  storeId: string
  productId: string
  newStock: number
  operation: 'add' | 'subtract'
}

const worker = new Worker(
  MEDICINE_REMAINDER_STOCK_NOTIFICATION_QUEUE,
  async (job) => {
    const { storeId, productId, newStock, operation } = job.data as MedicineRemainderStockNotificationJobData

    try {
      // console.log(
      //   `Processing medicine remainder stock notification for store: ${storeId}, product: ${productId}, newStock: ${newStock}`
      // )

      // Only process if stock was added (not subtracted)
      if (operation !== 'add' || newStock <= 0) {
        console.log('Skipping notification - stock was not added or is still zero/negative')
        return
      }

      // Find the delivery policy that includes this store
      const deliveryPolicy = await DeliveryPoliciesModel.findOne({
        stores: new ObjectId(storeId),
        active: true
      }).lean()

      if (!deliveryPolicy) {
        console.log(`No active delivery policy found for store: ${storeId}`)
        return
      }

      // Find all medicine remainders for this product in the delivery policy's postal codes
      const medicineRemainders = await MedicineRemainderModel.find({
        productId: new ObjectId(productId),
        deliveryPolicyId: deliveryPolicy._id,
        status: 'pending'
      }).lean()

      if (!medicineRemainders.length) {
        // console.log(
        //   `No pending medicine remainders found for product: ${productId} in delivery policy: ${deliveryPolicy._id}`
        // )
        return
      }

      // Get product details
      const product = await ProductsModel.findById(productId).select('title').lean()
      if (!product) {
        console.log(`Product not found: ${productId}`)
        return
      }

      // Get store details
      const storeInventory = await StoreInventoryModel.findOne({
        storeId: new ObjectId(storeId),
        productId: new ObjectId(productId)
      })
        .populate('storeId', 'storeName storeCode')
        .lean()

      if (!storeInventory) {
        console.log(`Store inventory not found for store: ${storeId}, product: ${productId}`)
        return
      }

      // Process each medicine remainder
      for (const remainder of medicineRemainders) {
        try {
          // Get user details
          const user = await UsersModel.findById(remainder.userId)
            .select('_id fullName email phoneNumber')
            .lean()
          if (!user) {
            console.log(`User not found: ${remainder.userId}`)
            continue
          }

          // Update the medicine remainder status to notified
          await MedicineRemainderModel.updateOne(
            { _id: remainder._id },
            {
              status: 'notified',
              notifiedAt: new Date().toISOString()
            }
          )

          // Send CleverTap event
          trackMedicineRemainder({
            userId: user._id.toString(),
            productId: productId,
            pincode: remainder.pincode
          })

          console.log(`CleverTap event sent for user: ${user._id}, product: ${product.title}`)
        } catch (error) {
          console.error(`Error processing medicine remainder ${remainder._id}:`, error)
          // Continue with other remainders even if one fails
        }
      }

      console.log(
        `Successfully processed ${medicineRemainders.length} medicine remainders for product: ${productId}`
      )
    } catch (error) {
      console.error('Error processing medicine remainder stock notification:', error)
      throw error // Re-throw to trigger retry mechanism
    }
  },
  {
    connection: redisConfig,
    concurrency: 5 // Process up to 5 jobs concurrently
  }
)

worker.on('completed', (job) => {
  console.log(`Medicine remainder stock notification job ${job.id} completed successfully`)
})

worker.on('failed', (job, err) => {
  console.error(`Medicine remainder stock notification job ${job?.id} failed:`, err.message)
})

worker.on('error', (err) => {
  console.error('Medicine remainder stock notification worker error:', err)
})

export default worker
