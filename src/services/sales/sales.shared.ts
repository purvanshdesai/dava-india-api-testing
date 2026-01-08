// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Sales, SalesData, SalesPatch, SalesQuery, SalesService } from './sales.class'

export type { Sales, SalesData, SalesPatch, SalesQuery }

export const salesPath = 'sales'

export const salesMethods: Array<keyof SalesService> = ['find', 'get', 'create', 'patch', 'remove']
