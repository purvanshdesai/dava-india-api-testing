// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type {
  ConsumerProducts,
  ConsumerProductsData,
  ConsumerProductsPatch,
  ConsumerProductsQuery
} from './products.schema'
import { VariationsModel } from '../super-admin/products/variations/variations.schema'
import { ProductsModel } from '../super-admin/products/products.schema'
import { BadRequest } from '@feathersjs/errors'
import { StoreInventoryModel } from '../store-inventory/store-inventory.schema'
import { app } from '../../app'

import { SponsoredModel } from '../sponsored/sponsored.schema'

import { Types } from 'mongoose'
import { CollectionModel } from '../collections/collections.schema'
import { cartModel } from '../carts/carts.schema'
import { getRandomElementFromArray } from '../../utils/utilities'

export type { ConsumerProducts, ConsumerProductsData, ConsumerProductsPatch, ConsumerProductsQuery }

export interface ProductsServiceOptions {
  app: Application
}

export interface ProductsParams extends Params<ConsumerProductsQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class ProductsService<ServiceParams extends ProductsParams = ProductsParams>
  implements ServiceInterface<ConsumerProducts, ConsumerProductsData, ServiceParams, ConsumerProductsPatch>
{
  constructor(public options: ProductsServiceOptions) {}

  async find(params: any): Promise<any> {
    const {
      $limit = 20,
      $skip = 0,
      category: categorySlug,
      sponsored,
      filter = null,
      page = 1,
      cartSimilarProducts = false,
      userId
    } = params.query

    let limit = $limit
    if (params.query.limit && parseInt(params.query.limit)) limit = parseInt(params.query.limit)

    let parsedFilter
    if (filter && filter !== 'undefined') {
      parsedFilter = filter ? JSON.parse(filter) : null
    }

    let matchQueries: any = [
      {
        $match: {
          isActive: true
        }
      }
    ]

    // Category Slug filter
    if (categorySlug && categorySlug.length > 0) {
      const collections = await this.getCollectionFilter(categorySlug)

      matchQueries.push({ $match: { collections: { $in: collections } } })
    }

    // sponsored section filter

    if (sponsored && sponsored.length > 0) {
      const sponsoredLayout = await SponsoredModel.findOne({
        title: {
          $regex: new RegExp(
            sponsored.replace(/-/g, ' '), // Convert hyphens to spaces for matching
            'i' // Case-insensitive match
          )
        }
      })
        .select('products')
        .lean()

      if (sponsoredLayout) {
        matchQueries.push({ $match: { _id: { $in: sponsoredLayout.products } } })
      }
    }

    if (parsedFilter) {
      const { price, discount, sortBy } = parsedFilter

      if (price) {
        matchQueries.push({
          $match: {
            finalPrice: { $gte: price.from || 0, $lte: Number(price.to) || 1000 }
          }
        })
      }

      if (discount) {
        matchQueries.push({
          $match: {
            discount: { $gte: discount.from || 0, $lte: discount.to || 1000 }
          }
        })
      }

      if (sortBy && sortBy !== 'none') {
        const sortFields: any = {
          'price-asc': { finalPrice: 1 },
          'price-desc': { finalPrice: -1 },
          discount: { discount: -1 },
          relevance: { createdAt: -1 }
        }
        const sortOption = sortFields[sortBy] || {}
        if (Object.keys(sortOption).length > 0) {
          matchQueries.push({ $sort: sortOption })
        }
      }
    }

    if (cartSimilarProducts && userId) {
      const cart = await cartModel.findOne({ userId }).lean()
      if (cart) {
        const cartProductIds = cart.items.map((item: any) => item.productId).flat()
        const products = await ProductsModel.find({ _id: { $in: cartProductIds } })
          .select('_id associatedProducts')
          .lean()
        const associatedProductIds = products.map((p: any) => p.associatedProducts).flat()
        if (associatedProductIds.length)
          matchQueries.push({
            $match: {
              _id: { $in: associatedProductIds }
            }
          })
      }
    }

    const updatedSkip = (page - 1) * Number(limit || 10)

    const products = await ProductsModel.aggregate([
      { $match: { $or: [{ deleted: false }, { deleted: { $exists: false } }] } },
      ...matchQueries,
      {
        $lookup: {
          from: 'collections', // The name of the referenced collection
          localField: 'collections', // Field in `products` collection
          foreignField: '_id', // Field in `collections` collection
          as: 'collections' // Output field name
        }
      },
      { $skip: updatedSkip },
      { $limit: parseInt(limit, 10) }
    ]).exec()

    const totalAggregation = await ProductsModel.aggregate([...matchQueries, { $count: 'total' }]).exec()
    const total = totalAggregation.length > 0 ? totalAggregation[0].total : 0

    return {
      data: products,
      skip: $skip,
      limit: limit,
      total
    }
  }

  async get(slugUrl: NullableId, _params?: ServiceParams): Promise<any> {
    const product = await ProductsModel.findOne({ 'seo.url': slugUrl, isActive: true })
      .populate('associatedProducts')
      .populate('consumption')
      .lean()

    let outOfStock = false
    let expiryDate = null

    if (!product) throw new BadRequest('Product not found')

    if (product?._id) {
      try {
        const result = await StoreInventoryModel.findOne({
          productId: product._id,
          $expr: {
            $gt: [
              {
                $subtract: [
                  {
                    $subtract: [
                      '$stock',
                      { $ifNull: ['$softHoldCount', 0] } // First subtraction
                    ]
                  },
                  { $ifNull: ['$softHoldForOrderCount', 0] }
                ]
              }, // field2 - field1
              0 // only include documents where the result is > 0
            ]
          }
        }).lean()

        outOfStock = result ? result.stock === 0 : true
        if (result?.batches?.length) {
          // Find the nearest (earliest) expiry date from all batches
          const today = new Date()
          let nearestExpiry = null
          let nearestExpiryDate = null
          
          for (const batch of result.batches) {
            if (batch.expiryDate) {
              const batchExpiryDate = new Date(batch.expiryDate)
              if (!nearestExpiryDate || batchExpiryDate < nearestExpiryDate) {
                nearestExpiryDate = batchExpiryDate
                nearestExpiry = batch.expiryDate
              }
            }
          }
          
          // If nearest expiry is more than 90 days away, display it
          if (nearestExpiryDate) {
            const daysDifference = (nearestExpiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            if (daysDifference > 90) {
              expiryDate = nearestExpiry
            }
          }
        }
      } catch (error) {
        throw error
      }
    }

    let variation
    let response: any = { variations: [product] }
    response.variations = [{ ...product, outOfStock, expiryDate }]

    if (product?.variationId) {
      variation = await VariationsModel.findById(product.variationId).lean()
      response = { ...response, ...variation }
      response.variations = await ProductsModel.aggregate([
        { $match: { variationId: product.variationId } }
      ]).exec()
    }
    return response
  }

  async getCollectionFilter(slug: string) {
    const [mainCategory, subCategory, childCategory] = slug?.split(',')

    if (childCategory) {
      const childColl = await CollectionModel.findOne({ slugUrl: childCategory }).select('_id').lean()

      return [childColl?._id]
    }

    if (subCategory) {
      const navigationTree = await CollectionModel.aggregate([
        // Match the subcategory by slug
        { $match: { slugUrl: subCategory } },

        // Lookup navigation entries related to the matched collection
        {
          $lookup: {
            from: 'navigations',
            localField: '_id',
            foreignField: 'collection',
            as: 'subMenu'
          }
        },

        // Unwind the subMenu array to process each entry
        { $unwind: '$subMenu' },

        // Lookup child menu items for each subMenu entry
        {
          $lookup: {
            from: 'navigations',
            localField: 'subMenu._id',
            foreignField: 'parentMenu',
            as: 'childMenu'
          }
        },

        // Extract collection IDs from both subMenu and childMenu
        {
          $project: {
            _id: 0,
            collectionIds: {
              $concatArrays: [
                ['$_id'], // Root collection ID
                ['$subMenu.collection'], // Submenu collection ID
                { $ifNull: [{ $map: { input: '$childMenu', as: 'child', in: '$$child.collection' } }, []] } // Child menu collection IDs
              ]
            }
          }
        },

        // Flatten the array of collection IDs
        { $unwind: '$collectionIds' },

        // Remove duplicates
        { $group: { _id: null, collectionIds: { $addToSet: '$collectionIds' } } },

        // Clean up the result
        { $project: { _id: 0, collectionIds: 1 } }
      ])

      // Extract the collection IDs
      const result = navigationTree[0]?.collectionIds || []

      return result
    }

    const collectionIds = await CollectionModel.aggregate([
      // Match the main category by slug
      { $match: { slugUrl: mainCategory } },

      // Lookup main menu entries related to the main collection
      {
        $lookup: {
          from: 'navigations', // Replace with the actual collection name for NavigationsModel
          localField: '_id',
          foreignField: 'collection',
          as: 'mainMenu'
        }
      },

      // Unwind the main menu array
      { $unwind: { path: '$mainMenu', preserveNullAndEmptyArrays: false } },

      // Lookup subMenu items for each mainMenu entry
      {
        $lookup: {
          from: 'navigations',
          localField: 'mainMenu._id',
          foreignField: 'parentMenu',
          as: 'subMenu'
        }
      },

      // Add a conditional lookup for childMenu
      {
        $lookup: {
          from: 'navigations',
          let: { subMenuIds: '$subMenu._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $cond: [
                    { $eq: [{ $size: '$$subMenuIds' }, 0] }, // Check if subMenu is empty
                    false, // Skip if subMenu is empty
                    { $in: ['$_id', '$$subMenuIds'] } // Match if subMenu exists
                  ]
                }
              }
            }
          ],
          as: 'childMenu'
        }
      },

      // Add default empty array if subMenu or childMenu is null
      {
        $addFields: {
          subMenu: { $ifNull: ['$subMenu', []] },
          childMenu: { $ifNull: ['$childMenu', []] }
        }
      },

      // Project collection IDs from mainMenu, subMenu, and childMenu
      {
        $project: {
          _id: 0,
          collectionIds: {
            $concatArrays: [
              [{ $ifNull: ['$_id', null] }], // Main collection ID
              [{ $ifNull: ['$mainMenu.collection', null] }], // Main menu collection ID
              {
                $map: {
                  input: '$subMenu',
                  as: 'sub',
                  in: '$$sub.collection' // Extract subMenu collection ID
                }
              },
              {
                $map: {
                  input: '$childMenu',
                  as: 'child',
                  in: '$$child.collection' // Extract childMenu collection ID
                }
              }
            ]
          }
        }
      },

      // Flatten all collection IDs into individual items
      { $unwind: '$collectionIds' },

      // Remove duplicates
      { $group: { _id: null, collectionIds: { $addToSet: '$collectionIds' } } },

      // Clean up the result
      { $project: { _id: 0, collectionIds: 1 } }
    ])

    // Extract the collection IDs
    const result = collectionIds[0]?.collectionIds || []

    // In this case, given category slug is not present in navigations. So fetch from collection
    if (!result.length) {
      const childColl = await CollectionModel.findOne({ slugUrl: mainCategory }).select('_id').lean()

      return [childColl?._id]
    }

    return result
  }
}

export class ProductSeoService<ServiceParams extends ProductsParams = ProductsParams>
  implements ServiceInterface<ConsumerProducts, ConsumerProductsData, ServiceParams, ConsumerProductsPatch>
{
  constructor(public options: ProductsServiceOptions) {}

  async get(slugUrl: NullableId, _params?: ServiceParams): Promise<any> {
    const product = await ProductsModel.findOne({ 'seo.url': slugUrl, isActive: true })
      .select('_id title description thumbnail')
      .lean()

    if (!product) throw new BadRequest('Product not found')

    return product
  }
}

export class ProductService<ServiceParams extends ProductsParams = ProductsParams>
  implements ServiceInterface<ConsumerProducts, ConsumerProductsData, ServiceParams, ConsumerProductsPatch>
{
  constructor(public options: ProductsServiceOptions) {}

  async find(params?: any): Promise<any> {
    const { slug, addressId, zipCode } = params?.query

    const product = await ProductsModel.findOne({ 'seo.url': slug, isActive: true })
      .populate('associatedProducts')
      .populate('consumption')
      .populate('collections', '_id name')
      .lean()

    let outOfStock = false,
      notDeliverable = false

    if (!product) throw new BadRequest('Product not found')

    let batch
    let batchStoreId
    let displayExpiryDate = null
    
    // Verify Product delivery policy and stock
    try {
      const availableStoresInventory = await app
        .service('carts/verify-product')
        .create({ productId: product?._id, addressId: addressId === 'undefined' ? null : addressId, zipCode })

      if (params.user?._id) {
        const cart = await cartModel.findOne({ userId: params.user._id }).lean()
        if (cart?.items?.length) {
          for (const storeId of Array.from(new Set(cart.items.map((i: any) => i.storeId.toString())))) {
            const storeInv = availableStoresInventory.find((inv: any) => inv.storeId.toString() === storeId)
            const batches = storeInv?.batches ?? []
            batch = getRandomElementFromArray(batches.filter((b: any) => b.stock > 0))
            batchStoreId = storeId
            if (batch?.stock > 0) break
          }
        }
      }

      if (!batch?.stock) {
        for (const storeInv of availableStoresInventory) {
          const today = new Date()
          const batches = storeInv.batches ?? []
          batch = getRandomElementFromArray(
            batches.filter((b: any) => {
              const expiryDate = new Date(b.expiryDate)
              const daysDifference = (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              return b.stock > 0 && daysDifference > 90
            })
          )
          batchStoreId = storeInv.storeId.toString()
          if (batch.stock > 0) break
        }
      }
      
      // Find nearest expiry from the nearest store's batches
      if (availableStoresInventory.length > 0) {
        const nearestStoreInv = availableStoresInventory[0] // First store is the nearest
        const batches = nearestStoreInv?.batches ?? []
        
        if (batches.length > 0) {
          const today = new Date()
          let nearestExpiry = null
          let nearestExpiryDate = null
          
          // Find the batch with the earliest expiry date
          for (const b of batches) {
            if (b.expiryDate) {
              const batchExpiryDate = new Date(b.expiryDate)
              if (!nearestExpiryDate || batchExpiryDate < nearestExpiryDate) {
                nearestExpiryDate = batchExpiryDate
                nearestExpiry = b.expiryDate
              }
            }
          }
          
          // If nearest expiry is more than 90 days away, display it
          if (nearestExpiryDate) {
            const daysDifference = (nearestExpiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            if (daysDifference > 90) {
              displayExpiryDate = nearestExpiry
            }
          }
        }
      }
    } catch (e: any) {
      if (e.message === 'NOT_DELIVERABLE') notDeliverable = true
      if (e.message === 'OUT_OF_STOCK') outOfStock = true
    }

    let variation
    let response: any = {
      variations: [
        {
          ...product,
          outOfStock,
          notDeliverable,
          batchNo: batch?.batchNo,
          expiryDate: displayExpiryDate,
          storeId: batchStoreId
        }
      ]
    }

    if (product?.variationId) {
      variation = await VariationsModel.findById(product.variationId).lean()
      response = { ...response, ...variation }
      response.variations = (
        await ProductsModel.aggregate([{ $match: { variationId: product.variationId } }]).exec()
      ).map((v) => ({ ...v, outOfStock, notDeliverable }))
    }
    return response
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
