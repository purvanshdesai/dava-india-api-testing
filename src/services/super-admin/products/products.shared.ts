// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../../client'
import type { Products, ProductsData, ProductsPatch, ProductsQuery, ProductsService } from './products.class'
import { HookContext } from '../../../declarations'
import { DeliveryPoliciesModel } from '../../delivery-policies/delivery-policies.schema'
import { StoreModel } from '../../stores/stores.schema'
import { StoreInventoryModel } from '../../store-inventory/store-inventory.schema'
import { getBatchesExpiryMoreThan90Days } from '../../store-inventory/store-inventory.shared'

export type { Products, ProductsData, ProductsPatch, ProductsQuery }

export type ProductsClientService = Pick<
  ProductsService<Params<ProductsQuery>>,
  (typeof productsMethods)[number]
>

export const productsPath = '/super-admin/products'

export const collectionProductsPath = '/super-admin/collection/products'

export const productsMethods: Array<keyof ProductsService> = ['find', 'get', 'create', 'patch', 'remove']

export const productsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(productsPath, connection.service(productsPath), {
    methods: productsMethods
  })
}

// Add this service to the client service type index
declare module '../../../client' {
  interface ServiceTypes {
    [productsPath]: ProductsClientService
  }
}

// Hook to set date fields
export const setTimestamp = async (context: HookContext) => {
  const { data, method } = context
  if (method === 'create') {
    data.createdAt = new Date().toISOString()
  }
  data.updatedAt = new Date().toISOString()
  return context
}

export const fetchProductStocks = async (products: Array<any>, consumerZipCode: string) => {
  try {
    const deliveryPolicy = await DeliveryPoliciesModel.findOne({
      postalCodes: consumerZipCode,
      active: true
    })
      .select('_id stores')
      .lean()

    if (!deliveryPolicy) return products

    const activeStores = await StoreModel.find({
      _id: { $in: deliveryPolicy?.stores },
      active: true,
      $or: [{ deleted: { $exists: false } }, { deleted: false }],
      serviceableZip: { $in: parseInt(consumerZipCode) }
    })
      .select('_id')
      .lean()

    if (!activeStores.length) return products

    return await Promise.all(
      products.map(async (product) => {
        const productStock = await StoreInventoryModel.findOne({
          storeId: { $in: activeStores.map((s) => s._id) },
          productId: product?._id,
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
                  { $ifNull: ['$softHoldForOrderCount', 0] } // Second subtraction
                ]
              }, // field2 - field1
              0 // only include documents where the result is > 0
            ]
          }
        })
          .populate('storeId', '_id storeName storeCode')
          .select('_id stock')
          .lean()

        if (!productStock) return product
        else {
          product.stockAvailable = productStock?.stock
          product.stockAvailableStore = productStock?.storeId

          return product
        }
      })
    )
  } catch (e) {
    return products
  }
}

export const getProductStockStatus = async (
  deliveryPolicy: any,
  productId: any,
  quantity: number,
  zipCode: string
) => {
  if (!deliveryPolicy) return { isNotDeliverable: true }

  const activeStores = await StoreModel.find({
    _id: { $in: deliveryPolicy?.stores },
    active: true,
    $or: [{ deleted: { $exists: false } }, { deleted: false }],
    serviceableZip: { $in: parseInt(zipCode) }
  })
    .select('_id')
    .lean()

  const productStock = await StoreInventoryModel.find({
    storeId: { $in: activeStores.map((s) => s._id) },
    productId: productId,
    stock: { $gt: 0 },
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
            { $ifNull: ['$softHoldForOrderCount', 0] } // Second subtraction
          ]
        }, // field2 - field1
        0 // only include documents where the result is > 0
      ]
    }
  })
    .select('_id stock softHoldCount softHoldForOrderCount storeId batches')
    .lean()

  const validBatches = getBatchesExpiryMoreThan90Days({
    batches: productStock?.flatMap((s) => s.batches)
  })

  if (!productStock.length || !validBatches.length) return { isOutOfStock: true }

  if (quantity) {
    const available = productStock.filter(
      (ps: any) => ps.stock - (ps.softHoldCount ?? 0) - (ps.softHoldForOrderCount ?? 0) >= quantity
    )
    if (!available.length) return { isOutOfStock: true }
  }

  return { stockAvailable: true }
}

export const exportProducts = async (filters: any): Promise<any[]> => {
  try {
    const { ProductsModel } = await import('./products.schema')
    const moment = await import('moment-timezone')
    const TZ = 'Asia/Kolkata'

    const baseMatch: any = {}

    const notDeleted = { $or: [{ deleted: false }, { deleted: { $exists: false } }] }

    const f = filters || {}

    if (f?.dateRange) {
      const dr = f.dateRange
      const startInput = dr.start ?? dr.from ?? dr.gte ?? dr[0]
      const endInput = dr.end ?? dr.to ?? dr.lte ?? dr[1]
      const createdAt: any = {}
      if (startInput) createdAt.$gte = moment.default.tz(startInput, TZ).startOf('day').toDate()
      if (endInput) createdAt.$lt = moment.default.tz(endInput, TZ).add(1, 'day').startOf('day').toDate()
      if (Object.keys(createdAt).length) baseMatch.createdAt = createdAt
    }

    if (f?.title) {
      if (typeof f.title === 'string') baseMatch.title = { $regex: f.title, $options: 'i' }
      else baseMatch.title = f.title
    }

    if (f?.sku) {
      if (typeof f.sku === 'string') baseMatch.sku = { $regex: f.sku, $options: 'i' }
      else baseMatch.sku = f.sku
    }

    if (f?.consumption) {
      baseMatch.consumption = Array.isArray(f.consumption) ? { $in: f.consumption } : f.consumption
    }

    if (f?.scheduledDrug) baseMatch.scheduledDrug = f.scheduledDrug
    if (f?.saltType) baseMatch.saltType = f.saltType
    if (typeof f?.isActive !== 'undefined') baseMatch.isActive = !!f.isActive
    if (typeof f?.prescriptionReq !== 'undefined') baseMatch.prescriptionReq = !!f.prescriptionReq

    if (f?.tags) baseMatch.tags = Array.isArray(f.tags) ? { $in: f.tags } : { $in: [f.tags] }
    if (f?.brandTags) baseMatch.brandTags = Array.isArray(f.brandTags) ? { $in: f.brandTags } : { $in: [f.brandTags] }

    if (f?.collections) baseMatch.collections = Array.isArray(f.collections) ? { $in: f.collections } : f.collections

    if (f?.finalPriceRange) {
      const r = f.finalPriceRange
      const m: any = {}
      if (typeof r?.min !== 'undefined') m.$gte = r.min
      if (typeof r?.max !== 'undefined') m.$lte = r.max
      if (Object.keys(m).length) baseMatch.finalPrice = m
    }

    if (f?.unitPriceRange) {
      const r = f.unitPriceRange
      const m: any = {}
      if (typeof r?.min !== 'undefined') m.$gte = r.min
      if (typeof r?.max !== 'undefined') m.$lte = r.max
      if (Object.keys(m).length) baseMatch.unitPrice = m
    }

    if (f?.mrpRange) {
      const r = f.mrpRange
      const m: any = {}
      if (typeof r?.min !== 'undefined') m.$gte = r.min
      if (typeof r?.max !== 'undefined') m.$lte = r.max
      if (Object.keys(m).length) baseMatch.maximumRetailPrice = m
    }

    const matchStage = f?.$or ? { $and: [{ $or: f.$or }, notDeleted, baseMatch] } : { $and: [notDeleted, baseMatch] }

    const products = await ProductsModel.aggregate([
      { $match: matchStage },
      { $sort: { _id: -1 } },
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
          from: 'app-data',
          localField: 'consumption',
          foreignField: '_id',
          as: 'consumptionDetails'
        }
      },
      { $unwind: { path: '$consumptionDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          title: 1,
          sku: 1,
          compositions: 1,
          minOrderQuantity: 1,
          maxOrderQuantity: 1,
          consumptionName: '$consumptionDetails.name',
          scheduledDrug: 1,
          saltType: 1,
          tags: 1,
          brandTags: 1,
          associatedProductDetails: { title: 1 },
          variation: 1,
          unitPrice: 1,
          maximumRetailPrice: 1,
          discount: 1,
          discountType: 1,
          finalPrice: 1,
          isActive: 1,
          prescriptionReq: 1,
          hsnNumber: 1,
          createdAt: 1
        }
      }
    ])

    const pickQuantityOrVolume = (v: Record<string, string> | undefined) => {
      if (!v) return ''
      const candidates = ['volume', 'quantity', 'packSize', 'size', 'weight', 'capacity']
      for (const key of candidates) {
        if (v[key]) return v[key]
      }
      return Object.values(v).filter(Boolean).join(' ')
    }

    const formatted = products.map((p: any) => ({
      'PRODUCT NAME': p?.title ?? '',
      SKU: p?.sku ?? '',
      'QUANTITY/VOLUME': pickQuantityOrVolume(p?.variation ?? {}),
      COMPOSITIONS: p?.compositions ?? '',
      'MIN ORDER QTY': p?.minOrderQuantity ?? '',
      'MAX ORDER QTY': p?.maxOrderQuantity ?? '',
      CONSUMPTION: p?.consumptionName ?? '',
      'SCHEDULED DRUG': p?.scheduledDrug ?? '',
      'SALT TYPE': p?.saltType ?? '',
      TAGS: Array.isArray(p?.tags) ? p.tags.join(', ') : '',
      SIMILAR: Array.isArray(p?.brandTags) ? p.brandTags.join(', ') : '',
      'ASSOCIATE PRODUCTS': Array.isArray(p?.associatedProductDetails)
        ? p.associatedProductDetails.map((ap: any) => ap.title).filter(Boolean).join(', ')
        : '',
      'UNIT PRICE': p?.unitPrice ?? '',
      MRP: p?.maximumRetailPrice ?? '',
      DISCOUNT: p?.discount ?? '',
      'DISCOUNT TYPE': p?.discountType ?? '',
      'FINAL PRICE': p?.finalPrice ?? '',
      'HSN NUMBER': p?.hsnNumber ?? '',
      STATUS: p?.isActive ? 'Active' : 'Inactive',
      PRESCRIPTION: p?.prescriptionReq ? 'Yes' : 'No',
      'CREATED AT': p?.createdAt ? moment.default(p.createdAt).tz(TZ).format('DD/MM/YYYY hh:mm A') : ''
    }))

    return formatted
  } catch (error) {
    console.error('Error exporting products:', error)
    throw new Error('Failed to export products')
  }
}
