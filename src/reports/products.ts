import { OrderItemTrackingModal } from '../services/order-item-tracking/order-item-tracking.schema'
import { OrderModel } from '../services/order/order.schema'
import { saveRecordsInExcelFile } from './utils'
import moment from 'moment-timezone'

export const generateOrderedProductStat = async () => {
  try {
    // NOTE: Make sure to make it dynamic flow when needed

    const year = moment().tz('UTC').year()
    // const month = params?.query?.month || moment().tz('UTC').month() + 1 // month is 1-based in input
    const month = 4

    const startDate = moment()
      .tz('UTC')
      .year(year)
      .month(month - 1)
      .startOf('month')
    const endDate = moment(startDate).add(1, 'month').endOf('month')

    // console.log(startDate.toDate(), endDate.toDate())

    const bestSellingProducts = await OrderModel.aggregate([
      { $match: { createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }, status: 'paid' } }, // Adjust start and end date
      { $match: { status: 'paid' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.productId', totalSales: { $sum: '$items.quantity' } } },
      { $sort: { totalSales: -1 } },
      //   { $limit: 6 }, // Adjust limit based on needs
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $project: {
          _id: 0,
          //   productId: '$_id',
          name: '$productInfo.title',
          sku: '$productInfo.sku',
          description: '$productInfo.description',
          sales: '$totalSales'
        }
      }
    ])

    const totalSales = bestSellingProducts.reduce((acc, product) => acc + product.sales, 0)
    bestSellingProducts.forEach((product) => {
      product.percentage = Math.round(totalSales ? (product.sales / totalSales) * 100 : 0)
    })

    // console.log('Total best selling products: ', bestSellingProducts.length)

    await saveRecordsInExcelFile(
      bestSellingProducts,
      `ProductsStat-${startDate.format('DDMMM')}-${endDate.format('DDMMM,YYYY')}`
    )

    return bestSellingProducts
  } catch (e) {
    return []
  }
}

export const generateOrderedProductStateWise = async () => {
  try {
    const year = moment().tz('UTC').year()
    const month = 6 // make this dynamic if needed

    const startDate = moment()
      .tz('UTC')
      .year(year)
      .month(month - 1)
      .startOf('month')
    const endDate = moment(startDate).add(1, 'month').endOf('month')

    // console.log(startDate.toDate(), endDate.toDate())

    const result = await OrderItemTrackingModal.aggregate([
      // Join with order

      {
        $lookup: {
          from: 'orders',
          localField: 'order',
          foreignField: '_id',
          as: 'order'
        }
      },
      { $unwind: '$order' },

      // Filter only paid orders
      {
        $match: {
          'order.createdAt': { $gte: startDate.toDate(), $lte: endDate.toDate() },
          'order.status': 'paid',
          isDeleted: { $ne: true }
        }
      },

      // Join with store
      {
        $lookup: {
          from: 'stores',
          localField: 'store',
          foreignField: '_id',
          as: 'store'
        }
      },
      { $unwind: '$store' },

      // Unwind order items
      { $unwind: '$order.items' },

      // Group by store state and productId to count total quantity
      {
        $group: {
          _id: {
            state: '$store.state',
            productId: '$order.items.productId'
          },
          totalQuantity: { $sum: '$order.items.quantity' }
        }
      },

      // Join with products for product info (optional)
      {
        $lookup: {
          from: 'products',
          localField: '_id.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },

      // Final projection
      {
        $project: {
          _id: 0,
          state: '$_id.state',
          // productId: '$_id.productId',
          productName: '$product.title',
          sku: '$product.sku',
          totalQuantity: 1
        }
      },

      // Optional: sort by state and quantity
      {
        $sort: { state: 1, totalQuantity: -1 }
      }
    ])

    // Optionally group the results by state in JS
    const stateWiseGrouped: Record<string, any[]> = {}
    result.forEach((item) => {
      if (!stateWiseGrouped[item.state]) {
        stateWiseGrouped[item.state] = []
      }
      stateWiseGrouped[item.state].push(item)
    })

    let recordsForSheet: any[] = []
    Object.keys(stateWiseGrouped).forEach((state) => {
      recordsForSheet = [...recordsForSheet, ...stateWiseGrouped[state]]
    })

    await saveRecordsInExcelFile(recordsForSheet, `ProdStateWise-${startDate.format('MMM,YYYY')}`)

    return recordsForSheet
  } catch (e) {
    console.error('Error generating state-wise product data:', e)
    return {}
  }
}
