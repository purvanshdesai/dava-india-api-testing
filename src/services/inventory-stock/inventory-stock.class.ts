// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'
import type { Application } from '../../declarations'

import { Types } from 'mongoose'
import {
  InventoryStock,
  InventoryStockData,
  InventoryStockModel,
  InventoryStockPatch,
  InventoryStockQuery
} from './inventory-stock.schema'
import { StoreInventoryModel } from '../store-inventory/store-inventory.schema'

export type { InventoryStock, InventoryStockData, InventoryStockPatch, InventoryStockQuery }

export interface InventoryStockServiceOptions {
  app: Application
}

export interface InventoryStockParams extends Params<InventoryStockQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class InventoryStockService<ServiceParams extends InventoryStockParams = InventoryStockParams>
  implements ServiceInterface<InventoryStock, InventoryStockData, ServiceParams, InventoryStockPatch>
{
  constructor(public options: InventoryStockServiceOptions) {}

  async find(_params?: any): Promise<any> {
    const { productId, paginate = true, skip = 0, limit = 10 } = _params.query
    const storeId = _params.user.storeIds[0].toString()

    const filter: any = {}
    if (storeId) filter['storeId'] = storeId
    if (productId) filter['productId'] = productId

    const stockEntries = await InventoryStockModel.find(filter)
      .populate({ path: 'createdBy', select: '_id fullName' })
      .sort({ createdAt: -1 })
      .skip(paginate ? skip : 0)
      .limit(paginate ? limit : 0)
      .lean()

    const count = paginate ? await InventoryStockModel.find(filter).countDocuments() : stockEntries.length

    if (!paginate) return stockEntries
    return {
      data: stockEntries,
      total: count,
      limit,
      skip
    }
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
