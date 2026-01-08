// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { PaginationOptions, Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../../declarations'
import {
  ProductsModel,
  type Products,
  type ProductsData,
  type ProductsPatch,
  type ProductsQuery
} from './products.schema'
import { ObjectId } from 'mongodb'
import { Types } from 'mongoose'
import { fetchProductStocks } from './products.shared'
import { BadRequest } from '@feathersjs/errors'
export type { Products, ProductsData, ProductsPatch, ProductsQuery }

export interface ProductsParams extends MongoDBAdapterParams<ProductsQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class ProductsService<ServiceParams extends Params = ProductsParams> extends MongoDBService<
  Products,
  ProductsData,
  ProductsParams,
  ProductsPatch
> {
  async get(id: string, params: any): Promise<any> {
    try {
      const pipeline: any[] = [
        { $match: { _id: new ObjectId(id) } },

        {
          $lookup: {
            from: 'products',
            localField: 'associatedProducts',
            foreignField: '_id',
            as: 'associatedProductDetails'
          }
        },
        {
          $lookup: {
            from: 'collections',
            localField: 'collections',
            foreignField: '_id',
            as: 'collectionsDetails'
          }
        },

        {
          $addFields: {
            associatedProductDetails: {
              $map: {
                input: '$associatedProductDetails',
                as: 'product',
                in: {
                  _id: '$$product._id',
                  productId: '$$product.productId',
                  title: '$$product.title',
                  unitPrice: '$$product.unitPrice',
                  finalPrice: '$$product.finalPrice',
                  images: '$$product.images',
                  description: '$$product.description'
                }
              }
            },
            collectionsDetails: {
              $map: {
                input: '$collectionsDetails',
                as: 'collection',
                in: {
                  _id: '$$collection._id',
                  name: '$$collection.name',
                  image: '$$collection.image',
                  description: '$$collection.description'
                }
              }
            }
          }
        },

        {
          $project: {
            healthWorkerDetails: 0,
            visitsInfo: 0,
            patientDetails: 0
          }
        }
      ]

      const result = await ProductsModel.aggregate(pipeline).exec()

      return result[0] || {}
    } catch (error) {
      console.error('Error fetching product by id:', error)
      throw new Error('Error fetching product by id')
    }
  }

  async find(params?: ProductsParams & { paginate?: PaginationOptions }): Promise<any> {
    const query: any = params?.query || {}
    const limit = parseInt(query.$limit) || 10 // Default limit to 10
    const skip = parseInt(query.$skip) || 0 // Default skip to 0
    const { $limit, $skip, consumerZipCode, showProductStock, ...filteredQuery } = query

    let productsQuery = filteredQuery

    if (productsQuery['$or']) {
      productsQuery = {
        ...filteredQuery,
        $and: [
          {
            $or: productsQuery['$or']
          },
          {
            $or: [{ deleted: false }, { deleted: { $exists: false } }]
          }
        ]
      }
    } else {
      productsQuery = { ...filteredQuery, $or: [{ deleted: false }, { deleted: { $exists: false } }] }
    }

    let products: any = await ProductsModel.find(productsQuery)
      .populate('collections')
      .limit(limit) // Apply limit for pagination
      .skip(skip) // Apply skip for pagination
      .lean()

    if (products?.length && showProductStock && consumerZipCode)
      products = await fetchProductStocks(products, consumerZipCode)

    const total = await ProductsModel.countDocuments(productsQuery)
    return {
      total,
      limit: limit || 10,
      skip: skip || 0,
      data: products
    }
  }

  async create(data: any, params?: Params): Promise<any> {
    try {
      const response = await ProductsModel.findOne({ 'seo.url': data?.seo?.url }).select('_id').lean()

      if (response) {
        throw new Error('Slug URL must be unique')
      }

      const transformedData = {
        ...data,
        title: data?.title.replace(/\s+/g, ' ').trim()
      }

      return await super.create(transformedData, params)
    } catch (error) {
      console.error('Error creating :', error)
      throw error
    }
  }

  async patch(id: any, data: any, params?: ProductsParams): Promise<any> {
    const foundProduct = await ProductsModel.findOne({
      _id: { $ne: new Types.ObjectId(id) },
      'seo.url': data.seo.url
    }).lean()

    if (foundProduct) throw new Error('Slug URL must be unique')

    const payload = {
      ...data,
      title: data?.title.replace(/\s+/g, ' ').trim()
    }

    return super.patch(id, payload, params)
  }

  async remove(id: any, params?: ProductsParams): Promise<any> {
    try {
      const product = await ProductsModel.findById(id).lean()

      if (!product) throw new BadRequest('Product not found')

      await ProductsModel.findByIdAndUpdate(id, { $set: { deleted: true } })

      return product
    } catch (error) {
      throw error
    }
  }
}

export class CollectionProductsService<ServiceParams extends Params = ProductsParams> extends MongoDBService<
  Products,
  ProductsData,
  ProductsParams,
  ProductsPatch
> {
  async find(params?: ProductsParams & { paginate?: PaginationOptions }): Promise<any> {
    const query = params?.query

    // Check if collections are provided in the query
    if (query?.collections && Array.isArray(query.collections)) {
      const products: any = await super.find({
        query: {
          collections: { $in: query.collections } // Match if product.collections contains any of the provided collection IDs
        }
      })

      return products
    }

    // If no collections query is provided, return all products or apply other filters
    return await super.find(params)
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('products'))
  }
}
