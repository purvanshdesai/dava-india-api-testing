import { StoreModel } from '../services/stores/stores.schema'
import { ProductsModel } from '../services/super-admin/products/products.schema'
import outOfStockTemplate from '../templates/outOfStockTemplate'
import { sendEmail } from './sendEmail'
import { sendSMS } from './sendSms'
export async function triggerEmailBasedOnStocks(
  storeId: string,
  productId: string,
  type: 'low' | 'out',
  remainingStock: number
) {
  try {
    const store = await StoreModel.findById(storeId).lean()
    const product = await ProductsModel.findById(productId).lean()
    const productName = product?.title.toUpperCase()
    const storeName = store?.storeName.toUpperCase()

    // console.log('response', productName, storeName)

    const emails = store?.storeSettings?.assignee
      .filter((item) => item.type === 'email')
      .map((item) => item.email)

    const sms = store?.storeSettings?.assignee
      .filter((item) => item.type === 'sms')
      .map((item) => item.mobile)

    // console.log('sms', sms)

    const payload: any = {
      productName,
      storeName,
      remainingStock
    }

    // console.log('email', emails)

    if (emails && emails.length > 0) {
      for (const email of emails) {
        try {
          sendEmail({
            to: email,
            subject: `Low Stock Alert: ${payload.productName} Inventory Running Low for ${payload.storeName}`,
            message: outOfStockTemplate(payload),
            attachments: []
          })
        } catch (err) {
          console.log('error occurred while sending low stock email', err)
        }
      }
    }

    if (sms?.length) {
      const message = `Low Stock Alert: ${payload.productName} Inventory Running Low for ${payload.storeName}`
      for (const mobile of sms) {
        try {
          sendSMS(mobile, message)
        } catch (err) {
          console.log('error occurred while sending low stock sms', err)
        }
      }
    }
  } catch (error) {
    console.log(error)
  }
}
