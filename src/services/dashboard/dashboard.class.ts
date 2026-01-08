// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import { UsersModel } from '../users/users.schema'
import { OrderModel } from '../order/order.schema'
import moment from 'moment-timezone'

type Dashboard = any
type DashboardData = any
type DashboardPatch = any
type DashboardQuery = any

export type { Dashboard, DashboardData, DashboardPatch, DashboardQuery }

export interface DashboardServiceOptions {
  app: Application
}

export interface DashboardParams extends Params<DashboardQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class DashboardService<ServiceParams extends DashboardParams = DashboardParams>
  implements ServiceInterface<Dashboard, DashboardData, ServiceParams, DashboardPatch>
{
  constructor(public options: DashboardServiceOptions) {}

  async find(params?: ServiceParams): Promise<Dashboard> {
    try {
      const year = params?.query?.year || moment().tz('UTC').year()
      const month = params?.query?.month || moment().tz('UTC').month() + 1 // month is 1-based in input

      const targetMonthStart = moment()
        .tz('UTC')
        .year(year)
        .month(month - 1)
        .startOf('month')
      const targetMonthEnd = moment(targetMonthStart).endOf('month')
      const lastMonthStart = moment(targetMonthStart).subtract(1, 'month').startOf('month')
      const lastMonthEnd = moment(targetMonthStart).subtract(1, 'month').endOf('month')
      const startOfYear = moment().tz('UTC').year(year).startOf('year').toDate()
      const endOfYear = moment().tz('UTC').year(year).endOf('year').toDate()

      const [currentMonthRevenue, lastMonthRevenue] = await Promise.all([
        OrderModel.aggregate([
          {
            $match: {
              createdAt: { $gte: targetMonthStart.toDate(), $lte: targetMonthEnd.toDate() },
              status: 'paid'
            }
          },
          { $group: { _id: null, totalRevenue: { $sum: '$orderTotal' } } }
        ]),
        OrderModel.aggregate([
          {
            $match: {
              createdAt: { $gte: lastMonthStart.toDate(), $lte: lastMonthEnd.toDate() },
              status: 'paid'
            }
          },
          { $group: { _id: null, totalRevenue: { $sum: '$orderTotal' } } }
        ])
      ])

      const revenueCurrent = currentMonthRevenue[0]?.totalRevenue || 0
      const revenueLast = lastMonthRevenue[0]?.totalRevenue || 0
      const revenueDifference = revenueLast ? ((revenueCurrent - revenueLast) / revenueLast) * 100 : 100

      const [currentMonthOrders, lastMonthOrders, currentMonthCustomers, lastMonthCustomers] =
        await Promise.all([
          OrderModel.countDocuments({
            createdAt: { $gte: targetMonthStart.toDate(), $lte: targetMonthEnd.toDate() },
            status: 'paid'
          }),
          OrderModel.countDocuments({
            createdAt: { $gte: lastMonthStart.toDate(), $lte: lastMonthEnd.toDate() },
            status: 'paid'
          }),
          UsersModel.countDocuments({
            createdAt: { $gte: targetMonthStart.toDate(), $lte: targetMonthEnd.toDate() }
          }),
          UsersModel.countDocuments({
            createdAt: { $gte: lastMonthStart.toDate(), $lte: lastMonthEnd.toDate() }
          })
        ])

      const ordersDifference = lastMonthOrders
        ? ((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100
        : 100

      const customersDifference = lastMonthCustomers
        ? ((currentMonthCustomers - lastMonthCustomers) / lastMonthCustomers) * 100
        : 100

      const { weeklySales, weeklyOrders } = await this.getWeeklySalesReport(targetMonthStart, targetMonthEnd)

      return {
        revenueStat: {
          currentMonth: revenueCurrent,
          lastMonth: revenueLast,
          difference: revenueDifference.toFixed(2) + '%'
        },
        ordersStat: {
          currentMonth: currentMonthOrders,
          lastMonth: lastMonthOrders,
          difference: ordersDifference.toFixed(2) + '%'
        },
        customersStat: {
          currentMonth: currentMonthCustomers,
          lastMonth: lastMonthCustomers,
          difference: customersDifference.toFixed(2) + '%'
        },
        yearRevenueReport: await this.getMonthlyRevenueReport(startOfYear, endOfYear),
        weeklySales,
        weeklyOrders,
        recentOrders: await this.getRecentOrders(),
        topSellingProducts: await this.getTopSellingProducts(
          targetMonthStart.toDate(),
          targetMonthEnd.toDate()
        ),
        dailyOrdersReport: await this.getDailyOrdersReport(targetMonthStart, targetMonthEnd)
      }
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  async getMonthlyRevenueReport(startOfYear: Date, endOfYear: Date) {
    const monthlyRevenue = await OrderModel.aggregate([
      {
        $match: { createdAt: { $gte: startOfYear, $lte: endOfYear }, status: 'paid' }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$orderTotal' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ])

    return Array.from({ length: 12 }, (_, i) => ({
      name: moment().month(i).format('MMM'),
      revenue: monthlyRevenue.find((m) => m._id === i + 1)?.revenue || 0
    }))
  }

  async getWeeklySalesReport(monthStart: moment.Moment, monthEnd: moment.Moment) {
    const weeklySales = []
    const weeklyOrders = []

    let startOfWeek = moment(monthStart).startOf('isoWeek')

    while (startOfWeek.isBefore(monthEnd)) {
      let endOfWeek = moment(startOfWeek).endOf('isoWeek')
      if (endOfWeek.isAfter(monthEnd)) endOfWeek = monthEnd

      const [weekRevenue, weeklyOrdersCount] = await Promise.all([
        OrderModel.aggregate([
          {
            $match: {
              createdAt: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() },
              status: 'paid'
            }
          },
          { $group: { _id: null, revenue: { $sum: '$orderTotal' } } }
        ]),
        OrderModel.countDocuments({
          createdAt: { $gte: startOfWeek.toDate(), $lte: endOfWeek.toDate() },
          status: 'paid'
        })
      ])

      weeklySales.push({
        startDate: startOfWeek.format('DD MMM YY'),
        endDate: endOfWeek.format('DD MMM YY'),
        week: `${startOfWeek.format('DD')}-${endOfWeek.format('DD')}`,
        revenue: weekRevenue[0]?.revenue || 0
      })

      weeklyOrders.push({
        startDate: startOfWeek.format('DD MMM YY'),
        endDate: endOfWeek.format('DD MMM YY'),
        week: `${startOfWeek.format('DD')}-${endOfWeek.format('DD')}`,
        orders: weeklyOrdersCount
      })

      startOfWeek.add(1, 'week')
    }

    return { weeklySales, weeklyOrders }
  }

  async getRecentOrders() {
    // Latest 5 customer paid status orders
    const orders = await OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', '_id name email')
      .select('_id orderId createdAt orderTotal status userId')

    return orders.map((o: any) => {
      return {
        _id: o._id,
        orderId: o.orderId,
        createdAt: moment(o.createdAt).format('YYYY-MM-DD'),
        orderTotal: o.orderTotal,
        status: o.status,
        customer: {
          id: o.userId._id,
          name: o.userId.name,
          email: o.userId.email
        }
      }
    })
  }

  async getTopSellingProducts(startDate: Date, endDate: Date) {
    const bestSellingProducts = await OrderModel.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate }, status: 'paid' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.productId', totalSales: { $sum: '$items.quantity' } } },
      { $sort: { totalSales: -1 } },
      { $limit: 6 },
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
          productId: '$_id',
          name: '$productInfo.title',
          description: '$productInfo.description',
          sales: '$totalSales'
        }
      }
    ])

    const totalSales = bestSellingProducts.reduce((acc, product) => acc + product.sales, 0)
    bestSellingProducts.forEach((product) => {
      product.percentage = Math.round(totalSales ? (product.sales / totalSales) * 100 : 0)
    })

    return bestSellingProducts
  }

  async getDailyOrdersReport(startOfMonth: moment.Moment, endOfMonth: moment.Moment) {
    const dailyOrders = await OrderModel.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfMonth.toDate(),
            $lte: endOfMonth.toDate()
          },
          status: 'paid'
        }
      },
      {
        $group: {
          _id: { day: { $dayOfMonth: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.day': 1 }
      }
    ])

    const daysInMonth = endOfMonth.date()

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      const formattedDate = moment(startOfMonth).date(day).format('D')
      const match = dailyOrders.find((d) => d._id.day === day)

      return {
        date: formattedDate,
        orders: match?.count || 0
      }
    })
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
