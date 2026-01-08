// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import { reportTypes } from './reports.shared'
import { generateOrderedProductStat, generateOrderedProductStateWise } from '../../reports/products'

type Reports = any
type ReportsData = {
  reportType: string
}
type ReportsPatch = any
type ReportsQuery = any

export type { Reports, ReportsData, ReportsPatch, ReportsQuery }

export interface ReportsServiceOptions {
  app: Application
}

export interface ReportsParams extends Params<ReportsQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class ReportsService<ServiceParams extends ReportsParams = ReportsParams>
  implements ServiceInterface<Reports, ReportsData, ServiceParams, ReportsPatch>
{
  constructor(public options: ReportsServiceOptions) {}

  async create(data: ReportsData, params?: ServiceParams): Promise<Reports>
  async create(data: ReportsData, _params?: ServiceParams): Promise<Reports | Reports[]> {
    try {
      switch (data.reportType) {
        case reportTypes.ORDERED_PRODUCT_STAT:
          await generateOrderedProductStat()
          break

        case reportTypes.ORDERED_PRODUCT_STATE_WISE:
          await generateOrderedProductStateWise()
          break

        default:
          console.log('Unsupported report type passed!')
      }

      return { message: 'Report generated!' }
    } catch (e) {
      throw e
    }
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
