// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Reports, ReportsData, ReportsPatch, ReportsQuery, ReportsService } from './reports.class'

export type { Reports, ReportsData, ReportsPatch, ReportsQuery }

export type ReportsClientService = Pick<ReportsService<Params<ReportsQuery>>, (typeof reportsMethods)[number]>

export const reportsPath = 'reports'

export const reportsMethods: Array<keyof ReportsService> = ['create']

export const reportTypes = {
  ORDERED_PRODUCT_STAT: 'orderedProductStat',
  ORDERED_PRODUCT_STATE_WISE: 'orderedProductStateWise'
}

export const reportsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(reportsPath, connection.service(reportsPath), {
    methods: reportsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [reportsPath]: ReportsClientService
  }
}
