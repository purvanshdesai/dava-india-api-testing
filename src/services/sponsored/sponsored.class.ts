// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  SponsoredModel,
  type Sponsored,
  type SponsoredData,
  type SponsoredPatch,
  type SponsoredQuery
} from './sponsored.schema'

import {
  SponsoredBannerModel,
  type SponsoredBanner,
  type SponsoredBannerData,
  type SponsoredBannerPatch,
  type SponsoredBannerQuery
} from './sponsored-banners.schema'

import { BadRequest } from '@feathersjs/errors'
import { ProductsModel } from '../super-admin/products/products.schema'

export type { Sponsored, SponsoredData, SponsoredPatch, SponsoredQuery }

export interface SponsoredParams extends MongoDBAdapterParams<SponsoredQuery> {}
export interface SponsoredBannerParams extends MongoDBAdapterParams<SponsoredBannerQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class SponsoredService<ServiceParams extends Params = SponsoredParams> extends MongoDBService<
  Sponsored,
  SponsoredData,
  SponsoredParams,
  SponsoredPatch
> {
  async create(data: any, params?: SponsoredParams): Promise<any> {
    try {
      const settings = await super.create(data)
      return settings
    } catch (error) {
      throw error
    }
  }

  async patch(id: any, data: any, params: any): Promise<any> {
    try {
      const sponsorExist = await SponsoredModel.findById(id).lean()
      if (!sponsorExist) {
        throw new BadRequest('section not found')
      }

      return await SponsoredModel.findByIdAndUpdate(id, { ...data }).lean()
    } catch (error) {
      throw error
    }
  }

  async find(params?: SponsoredParams): Promise<any> {
    try {
      const query: any = params?.query || {}
      const { $limit = 0, $skip = 0, ...filters } = query || {}

      // Extract pagination parameters
      const limit = parseInt(query.$limit) || 10 // Default limit to 10
      const skip = parseInt(query.$skip) || 0 // Default skip to 0

      const settings = await SponsoredModel.find(filters)
        .sort({ position: 1 })
        .populate('collections')
        .limit(limit) // Apply limit for pagination
        .skip(skip)
        .lean()

      const total = await SponsoredModel.countDocuments(filters)

      const sponsoredLayouts = await Promise.all(
        settings.map(async (s: any) => {
          if (s?.type == 'image')
            s.banner = await SponsoredBannerModel.findOne({ sponsoredId: s?._id }).select('_id')

          if (s?.type == 'featured-products')
            s.products = await ProductsModel.find({ collections: { $in: [s?.collection] } }).lean()

          return s
        })
      )

      return {
        data: sponsoredLayouts,
        total,
        limit,
        skip
      }
    } catch (error) {
      throw error
    }
  }

  async get(id: any): Promise<any> {
    try {
      const setting = await SponsoredModel.findById(id).populate('products').populate('collections').lean()
      if (!setting) {
        throw new BadRequest('Role not found')
      }

      if (['carousel', 'carousel-mini'].includes(setting?.type)) {
        const banners = await SponsoredBannerModel.find({ sponsoredId: setting?._id }).lean()
        return { ...setting, banners }
      }

      return setting
    } catch (error) {
      throw error
    }
  }

  async remove(id: unknown, params?: unknown): Promise<any> {
    const layout: any = await SponsoredModel.findByIdAndDelete(id).lean()

    if (['carousel', 'carousel-mini', 'image'].includes(layout?.type)) {
      await SponsoredBannerModel.deleteMany({ sponsoredId: layout?._id })
    }

    return layout
  }
}

export class SponsoredBannerService<
  ServiceParams extends Params = SponsoredBannerParams
> extends MongoDBService<SponsoredBanner, SponsoredBannerData, SponsoredBannerParams, SponsoredBannerPatch> {
  async create(data: any, _params?: SponsoredBannerParams): Promise<any> {
    try {
      let { type, ...restData } = data

      if (type === 'image') {
        const sponsored = await SponsoredModel.create({
          title: restData?.title,
          type: 'image',
          startDate: restData?.startDate,
          endDate: restData?.endDate,
          isActive: restData?.isActive,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })

        restData.sponsoredId = sponsored?._id
      }

      const settings = await SponsoredBannerModel.create(restData)

      return settings.toObject()
    } catch (error) {
      throw error
    }
  }

  async patch(id: any, data: any, params: any): Promise<any> {
    try {
      const sponsorExist = await SponsoredBannerModel.findById(id).lean()
      if (!sponsorExist) {
        throw new BadRequest('Sponsored banner not found')
      }

      let { type, ...restData } = data

      if (type === 'image') {
        await SponsoredModel.findByIdAndUpdate(data?.sponsoredId, {
          title: restData?.title,
          startDate: data?.startDate,
          endDate: data?.endDate,
          isActive: data?.isActive,
          updatedAt: new Date().toISOString()
        })
      }

      return await SponsoredBannerModel.findByIdAndUpdate(id, { ...restData }).lean()
    } catch (error) {
      throw error
    }
  }

  async find(params?: SponsoredBannerParams): Promise<any> {
    try {
      const query: any = params?.query || {}
      const { $limit = 0, $skip = 0, ...filters } = query || {}

      // Extract pagination parameters
      const limit = parseInt(query.$limit) || 10 // Default limit to 10
      const skip = parseInt(query.$skip) || 0 // Default skip to 0

      const settings = await SponsoredBannerModel.find(filters)
        .limit(limit) // Apply limit for pagination
        .skip(skip)
        .lean()

      const total = await SponsoredBannerModel.countDocuments(filters)

      return {
        data: settings,
        total,
        limit,
        skip
      }
    } catch (error) {
      throw error
    }
  }

  async get(id: any): Promise<any> {
    try {
      const setting = await SponsoredBannerModel.findById(id).lean()
      if (!setting) {
        throw new BadRequest('Role not found')
      }

      return setting
    } catch (error) {
      throw error
    }
  }

  async remove(id: unknown, _params?: unknown): Promise<any> {
    const banner: any = await SponsoredBannerModel.findByIdAndDelete(id).lean()

    return banner
  }
}

export class SponsoredLayoutPositioningService<
  ServiceParams extends Params = SponsoredBannerParams
> extends MongoDBService<SponsoredBanner, SponsoredBannerData, SponsoredBannerParams, SponsoredBannerPatch> {
  async create(layouts: any, _params?: SponsoredBannerParams): Promise<any> {
    try {
      const bulkOperations = layouts?.map(({ _id, position }: { _id: string; position: number }) => ({
        updateOne: {
          filter: { _id }, // Assuming `id` maps to `_id` in your collection
          update: { $set: { position } }
        }
      }))

      await SponsoredModel.bulkWrite(bulkOperations)

      return { message: 'Re Ordered Success!' }
    } catch (error) {
      throw error
    }
  }
}

export class SponsoredConsumerService<
  ServiceParams extends Params = SponsoredBannerParams
> extends MongoDBService<SponsoredBanner, SponsoredBannerData, SponsoredBannerParams, SponsoredBannerPatch> {
  async find(_params?: any): Promise<any> {
    try {
      const settings = await SponsoredModel.find({ isActive: true })
        .sort({ position: 1 })
        .populate('products')
        .populate('collections')
        .populate('collection')
        .lean()
      return await Promise.all(
        settings?.map(async (s: any) => {
          if (['image', 'carousel', 'carousel-mini'].includes(s.type)) {
            if (s.type == 'image')
              s.banner = await SponsoredBannerModel.findOne({ sponsoredId: s?._id }).lean()
            else s.banners = await SponsoredBannerModel.find({ sponsoredId: s?._id }).lean()
          }

          if (s?.type == 'featured-products')
            s.products = await ProductsModel.find({
              collections: { $in: [s?.collection] },
              isActive: true
            })
              .populate('collections', '_id name')
              .lean()

          return s
        })
      )
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('sponsored'))
  }
}
