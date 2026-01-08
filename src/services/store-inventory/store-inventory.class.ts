// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Paginated, PaginationOptions, Params } from '@feathersjs/feathers'
import { AdapterId, MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  StoreInventory,
  StoreInventoryData,
  StoreInventoryModel,
  StoreInventoryPatch,
  StoreInventoryQuery
} from './store-inventory.schema'
import { addInventoryStockEntry } from '../../utils/inventory'
import { CONSTANTS, InventoryStockModel } from '../inventory-stock/inventory-stock.schema'
import { ProductsModel } from '../super-admin/products/products.schema'
import { Types } from 'mongoose'
import moment from 'moment-timezone'

export type { StoreInventory, StoreInventoryData, StoreInventoryPatch, StoreInventoryQuery }

export interface StoreInventoryParams extends MongoDBAdapterParams<StoreInventoryQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class StoreInventoryService<
  ServiceParams extends Params = StoreInventoryParams
> extends MongoDBService<StoreInventory, StoreInventoryData, StoreInventoryParams, StoreInventoryPatch> {
  async get(id: AdapterId, params?: StoreInventoryParams): Promise<any> {
    return await StoreInventoryModel.findById(id)
      .populate({ path: 'storeId', select: '_id storeName' })
      .populate({
        path: 'productId',
        select: '_id title description images finalPrice subCategoryId',
        populate: { path: 'subCategoryId', model: 'categories', select: '_id name' }
      })
      .lean()
  }

  async find(params?: any & { paginate?: PaginationOptions }): Promise<any> {
    const { productId, productName, paginate = true, skip = 0, limit = 10 } = params.query

    const filter: any = {}
    // if (storeId) filter['storeId'] = storeId
    filter['storeId'] = params.user.storeIds[0]
    if (productId) filter['productId'] = new Types.ObjectId(productId)

    const pipeline = []

    pipeline.push(
      { $match: filter },
      {
        $lookup: {
          from: 'stores', // Replace 'stores' with your store collection name
          localField: 'storeId',
          foreignField: '_id',
          as: 'storeDetails'
        }
      },
      { $unwind: '$storeDetails' },
      {
        $lookup: {
          from: 'products', // Replace with the actual name of your products collection
          localField: 'productId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' }, // Only include documents where productDetails exists
      {
        $lookup: {
          from: 'store-admin-users', // Collection name for store admin users
          localField: 'createdBy', // Field that holds the user reference
          foreignField: '_id', // Primary key in 'store-admin-users'
          as: 'createdByUserDetails'
        }
      },
      { $unwind: { path: '$createdByUserDetails', preserveNullAndEmptyArrays: true } }
    )

    if (productName) {
      pipeline.push({
        $match: {
          $or: [
            { 'productDetails.title': { $regex: productName || '', $options: 'i' } },
            { 'productDetails.sku': { $regex: productName || '', $options: 'i' } }
          ]
        }
      })
    }

    pipeline.push(
      {
        $lookup: {
          from: 'categories',
          localField: 'productDetails.subCategoryId',
          foreignField: '_id',
          as: 'productDetails.subCategory'
        }
      },
      {
        $facet: {
          totalCount: [{ $count: 'count' }], // Get the total count of matching documents
          paginatedResults: [
            { $skip: paginate ? skip : 0 },
            { $limit: paginate ? limit : 0 },
            {
              $project: {
                _id: 1,
                stock: 1,
                'storeDetails._id': 1,
                'storeDetails.storeName': 1,
                'productDetails._id': 1,
                'productDetails.title': 1,
                'productDetails.description': 1,
                'productDetails.images': 1,
                'productDetails.finalPrice': 1,
                'productDetails.subCategory._id': 1,
                'productDetails.subCategory.name': 1,
                'createdByUserDetails.fullName': 1
              }
            }
          ]
        }
      }
    )

    const inventory = await StoreInventoryModel.aggregate(pipeline).exec()

    const inventoryResult = inventory[0]?.paginatedResults || []
    const count = inventory[0].totalCount[0]?.count || 0

    if (!paginate) return inventoryResult
    return {
      data: inventoryResult,
      total: count,
      limit,
      skip
    }
  }

  async create(data: any, params?: any): Promise<any> {
    const { productId, stock, createdBy, batchNo, expiryDate } = data
    const storeId = params.user.storeIds[0].toString()
    if (!storeId || !productId || !stock || !batchNo || !expiryDate)
      throw new Error('Store, Product Stock, Batch No and Expiry Date are required')

    const exist = await StoreInventoryModel.findOne({
      storeId,
      productId
    }).lean()
    if (exist) throw new Error('Product already exists in inventory')

    const inventory = (
      await StoreInventoryModel.create({
        storeId,
        productId,
        stock: 0,
        createdBy: params?.user?._id
      })
    ).toObject()

    await addInventoryStockEntry({
      storeId: storeId.toString(),
      productId: productId.toString(),
      quantity: stock,
      operation: 'add',
      reason: 'Added product to inventory',
      updatedBy: params.user._id,
      batchNo,
      expiryDate: new Date(expiryDate)
    })

    return inventory
  }

  async update(id: any, data: any, params?: any): Promise<any> {
    const { quantity, operation, reason, batchNo, expiryDate } = data
    if (!quantity || !operation || !batchNo) throw new Error('Stock operation and bath no are required')

    const inventory = await StoreInventoryModel.findById(id).lean()
    if (!inventory) throw new Error('Inventory not found')

    const { storeId, productId } = inventory
    const doc = await addInventoryStockEntry({
      storeId: storeId.toString(),
      productId: productId.toString(),
      quantity,
      operation,
      reason,
      updatedBy: params.user._id,
      batchNo,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined
    })

    if (!doc) return

    return InventoryStockModel.findById(doc._id)
      .populate({ path: 'createdBy', select: '_id fullName' })
      .lean()
  }
}

export class ProductListForInventoryService<
  ServiceParams extends Params = StoreInventoryParams
> extends MongoDBService<StoreInventory, StoreInventoryData, StoreInventoryParams, StoreInventoryPatch> {
  async find(params?: any & { paginate?: PaginationOptions }): Promise<any> {
    const { paginate = true, skip = 0, limit = 10 } = params.query

    const storeId = params.user.storeIds[0].toString()
    const filters: any = params?.query?.filters
    // Build base query
    let query = {}

    // If filters exist, apply them
    if (filters?.length > 0) {
      filters.forEach((filter: any) => {
        if (filter.id === 'product' && filter.value) {
          query = {
            $or: [
              { title: { $regex: filter.value, $options: 'i' } },
              { sku: { $regex: filter.value, $options: 'i' } }
            ]
          }
        }
      })
    }

    const products = await ProductsModel.find(query)
      .populate({ path: 'featuredListId', model: 'categories', select: '_id name variation' })
      .skip(paginate ? skip : 0)
      .limit(paginate ? limit : 0)
      .lean()

    const inventoryProducts = (
      await StoreInventoryModel.find({
        storeId,
        productId: { $in: products.map((p) => p._id) }
      })
        .select('productId')
        .lean()
    ).map((i) => i.productId.toString())

    const productsResp = products.map((p) => ({
      ...p,
      isAdded: inventoryProducts.includes(p._id.toString())
    }))

    const count = paginate ? await ProductsModel.find({}).countDocuments() : productsResp.length

    if (!paginate) return productsResp
    return {
      data: productsResp,
      total: count,
      limit,
      skip
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('store-inventory'))
  }
}
