// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type { Downloads, DownloadsData, DownloadsPatch, DownloadsQuery } from './downloads.schema'
import { OrderItemTrackingModal } from '../order-item-tracking/order-item-tracking.schema'
import { Types } from 'mongoose'
import { generateOrderInvoice, OrderInvoiceParams } from '../../utils/order-invoice'
import { app } from '../../app'
import moment from 'moment-timezone'
import { StoreInventoryModel } from '../store-inventory/store-inventory.schema'
import converter from 'number-to-words'
import fs from 'fs'
import path from 'path'
import { uploadFileToS3 } from '../../utils/utilities'
import { generateRandomNumber } from '../../utils'
import { PaymentModel } from '../payment/payment.schema'

export type { Downloads, DownloadsData, DownloadsPatch, DownloadsQuery }

export interface DownloadsServiceOptions {
  app: Application
}

export interface DownloadsParams extends Params<DownloadsQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class DownloadsService<ServiceParams extends DownloadsParams = DownloadsParams>
  implements ServiceInterface<Downloads, DownloadsData, ServiceParams, DownloadsPatch>
{
  constructor(public options: DownloadsServiceOptions) {}

  async find(_params?: ServiceParams): Promise<Downloads[]> {
    return []
  }

  async get(id: Id, _params?: ServiceParams): Promise<Downloads> {
    return {
      id: 0,
      text: `A new message with ID: ${id}!`
    }
  }

  async create(data: DownloadsData, params?: ServiceParams): Promise<Downloads>
  async create(data: DownloadsData[], params?: ServiceParams): Promise<Downloads[]>
  async create(
    data: DownloadsData | DownloadsData[],
    params?: ServiceParams
  ): Promise<Downloads | Downloads[]> {
    if (Array.isArray(data)) {
      return Promise.all(data.map((current) => this.create(current, params)))
    }

    return {
      id: 0,
      ...data
    }
  }

  // This method has to be added to the 'methods' option to make it available to clients
  async update(id: NullableId, data: DownloadsData, _params?: ServiceParams): Promise<Downloads> {
    return {
      id: 0,
      ...data
    }
  }

  async patch(id: NullableId, data: DownloadsPatch, _params?: ServiceParams): Promise<Downloads> {
    return {
      id: 0,
      text: `Fallback for ${id}`,
      ...data
    }
  }

  async remove(id: NullableId, _params?: ServiceParams): Promise<Downloads> {
    return {
      id: 0,
      text: 'removed'
    }
  }
}

export class DownloadInvoiceService<ServiceParams extends DownloadsParams = DownloadsParams>
  implements ServiceInterface<Downloads, DownloadsData, ServiceParams, DownloadsPatch>
{
  constructor(public options: DownloadsServiceOptions) {}

  async find(_params?: ServiceParams): Promise<Downloads[]> {
    return []
  }

  async get(id: Id, _params?: ServiceParams): Promise<any> {
    const charges = [
      { type: 'charges', name: 'Shipping Charges - OTH', key: 'deliveryCharge', hsn: '996812', rate: 18 },
      {
        type: 'charges',
        name: 'Green Packaging Charge - OTH',
        key: 'packingCharge',
        hsn: '998549',
        rate: 18
      },
      { type: 'charges', name: 'Handling Charges - OTH', key: 'handlingCharge', hsn: '996719', rate: 18 },
      { type: 'charges', name: 'Platform Fee - OTH', key: 'platformFee', hsn: '999799', rate: 18 }
    ]

    const orderTracking: any = await OrderItemTrackingModal.findOne({
      _id: new Types.ObjectId(id)
    })
      .populate({ path: 'items', populate: { path: 'product' } })
      .populate('store')
      .populate({ path: 'order', populate: { path: 'userId' } })
      .lean()

    if (!orderTracking) throw new Error('No order tracking details found')

    if (orderTracking.invoiceUrl)
      return { invoiceUrl: orderTracking.invoiceUrl, invoiceNo: orderTracking.invoiceNo }

    let invoiceNo
    if (orderTracking.invoiceNo) {
      invoiceNo = orderTracking.invoiceNo
    } else {
      const generateInvoiceNo = async () => {
        const total = await OrderItemTrackingModal.countDocuments({})
        const randomNo = generateRandomNumber(4)
        const timestamp = moment().format('YYYYMMDD')
        return `${timestamp}${total}${randomNo}`
      }
      invoiceNo = await generateInvoiceNo()
      await OrderItemTrackingModal.findByIdAndUpdate(orderTracking._id, { invoiceNo })
    }
    const { store, items, order } = orderTracking

    const orderPayment = await PaymentModel.findOne({ order: order?._id }).lean()

    const inventoryFilter = items.map((item: any) => ({
      storeId: orderTracking.store._id,
      productId: item.product._id
    }))
    const inventory = await StoreInventoryModel.find({ $or: inventoryFilter }).lean()

    const getAddress = (address: any) => {
      return `${address.addressLine1}, ${address.addressLine2}, ${address.city}, ${address.state} - ${address.postalCode}`
    }

    const orderTotal = items.reduce(
      (acc: number, curr: any) => acc + curr.quantity * curr.product.finalPrice,
      0
    )
    let grossAmount = items.reduce(
      (acc: number, curr: any) => acc + curr.quantity * curr.product.maximumRetailPrice,
      0
    )
    grossAmount = parseFloat(grossAmount.toFixed(2))

    let orderTotalDiscount: number =
      items.reduce((acc: number, curr: any) => {
        const { discountType } = curr.product
        if (discountType === 'flat') acc += curr.quantity * curr.product.discount
        else acc += curr.quantity * (curr.product.maximumRetailPrice - curr.product.finalPrice)
        return acc
      }, 0) + (order.discountedAmount || 0)

    orderTotalDiscount = parseFloat(orderTotalDiscount.toFixed(2))
    const payableAmount =
      orderTotal +
      (orderTracking.order.deliveryCharge || 0) -
      (order.discountedAmount || 0) +
      (order.handlingCharge || 0) +
      (order.packingCharge || 0) +
      (order.platformFee || 0)
    const payableAmountRounded = Math.round(payableAmount)

    const orderInvoiceParams: OrderInvoiceParams = {
      store: {
        name: store.storeName,
        address: `${store.address}, ${store.city} - ${store.pincode}`,
        phoneNo: store.phoneNumber,
        fssaiNo: store.fssaiNumber,
        dlNo: store.licenceNumber,
        gstNo: store.gstNumber,
        state: store.state,
        pincode: store.pincode
      },
      customer: {
        invoiceNo: invoiceNo,
        invoiceDate: moment().tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm A'),
        paymentMethod: orderPayment?.paymentResponse
          ? (orderPayment?.paymentResponse?.mode ?? orderPayment?.paymentResponse?.method)
          : '-',
        transactionId: orderPayment?.paymentResponse
          ? (orderPayment?.paymentResponse?.mihpayid ?? orderPayment?.paymentResponse?.id)
          : '-',
        transactionDate:
          orderPayment?.paymentResponse?.addedon ??
          (orderPayment?.paymentResponse?.created_at
            ? moment.unix(orderPayment?.paymentResponse?.created_at).format('DD-MM-YYYY HH:mm A')
            : '-'),
        orderId: order.orderId,
        name: order.address.userName,
        address: getAddress(order.address),
        qrLink: app.get('clientWeb') + `/download-invoice/${id}`,
        date: moment().tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm A')
      },
      orderItems: [...items, ...charges]
        .filter((i: any) => !i.isCancelRequested && !i.isReturnRequested)
        .map((item: any, index: number) => {
          if (item.type === 'charges') {
            const chargeApplied = order[item?.key]

            const gstAmount = (chargeApplied * 18) / 100

            return {
              index: index + 1,
              productName: item?.name,
              manufacturer: '',
              bathNo: '',
              expiryDate: '',
              quantity: 1,
              mrp: '0.00',
              discountAmount: '0.00',
              taxableAmount: Number(chargeApplied - gstAmount).toFixed(2),
              hsn: item?.hsn,
              gstRate: 18,
              gstAmount: Number(gstAmount).toFixed(2),
              totalAmount: chargeApplied,
              schedule: ''
            }
          }

          const product = item.product
          const productInventory = inventory?.find(
            (inv: any) => inv.productId.toString() === product._id.toString()
          )
          const batch = productInventory?.batches?.find((b: any) => b.batchNo === item.batchNo)

          const taxableAmount = product.finalPrice * item.quantity
          const gstAmount = item.gstDetails?.totalAmount ?? 0

          return {
            index: index + 1,
            productName: product.title,
            manufacturer: product.aboutProduct?.manufacturerInfo ?? '-',
            bathNo: item?.batchNo ?? '-',
            expiryDate: batch ? moment(batch.expiryDate).format('MM/YY') : '-',
            quantity: item.quantity,
            mrp: product.maximumRetailPrice,
            discountAmount: parseFloat(
              (product.discountType === 'flat'
                ? product.discount * item.quantity
                : (product.maximumRetailPrice - product.finalPrice) * item.quantity
              ).toFixed(2)
            ),
            taxableAmount: Number(taxableAmount - gstAmount).toFixed(2),
            hsn: product?.hsnNumber ?? '0',
            gstRate: item.gstDetails?.totalRate ?? 0,
            gstAmount: Number(gstAmount).toFixed(2),
            totalAmount: Number(product.finalPrice * item.quantity).toFixed(2),
            schedule: product?.scheduledDrug ?? 'None'
          }
        }),
      taxes: this.calculateTaxes(items, charges, order),
      finalCalculations: {
        discountAmount: orderTotalDiscount,
        roundOff: parseFloat((payableAmountRounded - payableAmount).toFixed(2)),
        shippingAndDeliveryCharges:
          (order.deliveryCharge ?? 0) +
          (order?.handlingCharge ?? 0) +
          (order?.packingCharge ?? 0) +
          (order?.platformFee ?? 0),
        handlingCharge: order.handlingCharge,
        packingCharge: order.packingCharge,
        platformFee: order.platformFee,
        totalQuantity: items.reduce((acc: number, curr: any) => acc + curr.quantity, 0),
        grossAmount: grossAmount,
        billAmount: parseFloat(orderTotal.toFixed(2)),
        payableAmount: payableAmountRounded,
        amountInWords: converter.toWords(payableAmountRounded)
      }
    }

    const invoicePath = await generateOrderInvoice(orderInvoiceParams)
    const resp = await uploadFileToS3({ filePath: invoicePath, mimeType: 'application/pdf' })

    await OrderItemTrackingModal.findByIdAndUpdate(orderTracking._id, { invoiceUrl: resp.Location })

    return {
      invoiceUrl: resp.Location,
      invoiceNo
    }
  }

  calculateTaxes(items: Array<any> = [], charges: Array<any> = [], order: any) {
    const chargesGst = charges.map((charge) => {
      const chargeApplied = order[charge?.key]

      return {
        totalRate: charge.rate,
        totalAmount: (chargeApplied * charge.rate) / 100,
        components: [
          { name: 'CGST', rate: '9', totalAmount: (chargeApplied * 9) / 100 },
          { name: 'SGST', rate: '9', totalAmount: (chargeApplied * 9) / 100 },
          { name: 'IGST', rate: '0', totalAmount: 0 }
        ]
      }
    })

    const itemsGst = items.reduce((acc, item) => {
      if (item?.gstDetails) acc.push(item.gstDetails)
      return acc
    }, [])

    // Calculate grouped totals by totalRate
    const groupedTotals = [...itemsGst, ...chargesGst].reduce((acc: any, gstDetail: any) => {
      const { totalRate, components } = gstDetail

      if (!acc[totalRate]) acc[totalRate] = { CGST: 0, SGST: 0, IGST: 0, taxableAmount: 0 }

      acc[totalRate].taxableAmount += gstDetail?.totalAmount

      components.forEach((component: any) => {
        const { name, totalAmount } = component
        acc[totalRate][name] += totalAmount
      })

      return acc
    }, {})

    const gstPercentages = [0, 5, 12, 18, 28]

    return gstPercentages?.map((percent) => {
      return {
        gstPercentage: percent,
        taxableAmount: parseFloat((groupedTotals[percent]?.taxableAmount || 0).toFixed(2)),
        cgst: parseFloat((groupedTotals[percent]?.CGST || 0).toFixed(2)),
        sgst: parseFloat((groupedTotals[percent]?.SGST || 0).toFixed(2)),
        igst: parseFloat((groupedTotals[percent]?.IGST || 0).toFixed(2))
      }
    })
  }

  async create(data: DownloadsData, params?: ServiceParams): Promise<Downloads>
  async create(data: DownloadsData[], params?: ServiceParams): Promise<Downloads[]>
  async create(
    data: DownloadsData | DownloadsData[],
    params?: ServiceParams
  ): Promise<Downloads | Downloads[]> {
    if (Array.isArray(data)) {
      return Promise.all(data.map((current) => this.create(current, params)))
    }

    return {
      id: 0,
      ...data
    }
  }

  // This method has to be added to the 'methods' option to make it available to clients
  async update(id: NullableId, data: DownloadsData, _params?: ServiceParams): Promise<Downloads> {
    return {
      id: 0,
      ...data
    }
  }

  async patch(id: NullableId, data: DownloadsPatch, _params?: ServiceParams): Promise<Downloads> {
    return {
      id: 0,
      text: `Fallback for ${id}`,
      ...data
    }
  }

  async remove(id: NullableId, _params?: ServiceParams): Promise<Downloads> {
    return {
      id: 0,
      text: 'removed'
    }
  }
}

export const getOptions = (app: Application) => {
  return { app }
}

async function uploadFileInternally(app: Application, filePath: string, storageType?: 'local' | 'S3') {
  // Read file as buffer
  const fileBuffer = fs.readFileSync(filePath)

  // Extract file name from path
  const fileName = path.basename(filePath)

  // Prepare data as it would be received from a client-side FormData
  const fileData = {
    uri: filePath, // Optional - for debugging
    originalname: fileName,
    buffer: fileBuffer,
    mimetype: 'application/octet-stream' // Set appropriate MIME type
  }

  // Call the attachments service internally
  const uploadedFiles = await app.service('attachments').create(
    {
      files: [fileData] // Sending file as an array of attachments
    },
    {
      query: storageType ? { storageType } : {}, // Pass storageType as query param
      files: [fileData]
    }
  )

  return uploadedFiles
}
