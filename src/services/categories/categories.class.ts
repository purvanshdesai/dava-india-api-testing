// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Id, Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  CategoryModel,
  type Categories,
  type CategoriesData,
  type CategoriesPatch,
  type CategoriesQuery
} from './categories.schema'
import { BadRequest } from '@feathersjs/errors'

export type { Categories, CategoriesData, CategoriesPatch, CategoriesQuery }

export interface CategoriesParams extends MongoDBAdapterParams<CategoriesQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class CategoriesService<ServiceParams extends Params = CategoriesParams> extends MongoDBService<
  Categories,
  CategoriesData,
  CategoriesParams,
  CategoriesPatch
> {
  async find(params?: CategoriesParams | undefined): Promise<any> {
    try {
      const query: any = params?.query || {}

      // If query has a 'type', return filtered categories based on that type
      if (query?.type) {
        return await CategoryModel.find(query).populate('subCategories').lean()
      }

      // Extract pagination parameters
      const limit = parseInt(query.$limit) || 0
      const skip = parseInt(query.$skip) || 0

      // Find categories based on the query with pagination
      const categories = await CategoryModel.find({
        ...query.query
      })
        .populate('subCategories')
        .limit(limit) // Apply limit
        .skip(skip) // Apply skip
        .lean()

      // Count total number of matching documents
      const total = await CategoryModel.countDocuments({ ...query.query })

      // Return the result with pagination data
      return {
        data: categories,
        total,
        limit,
        skip
      }
    } catch (error) {
      throw error
    }
  }

  async create(data: any): Promise<any> {
    try {
      let categoryData = { ...data }

      if (data.type === 'mainCategory') {
        categoryData = {
          ...data,
          subCategories: data.subCategories || []
        }
      }
      if (data.type === 'subCategory') {
        // const categoriesURL = await CategoryModel.findOne({ 'seo.url': data?.seo?.url }).lean()
        // if (!categoriesURL?._id) {
        //   throw new Error('Slug URL must be unique')
        // }

        categoryData = {
          ...data,
          mainCategories: data.mainCategories || []
        }
      }
      const category = await CategoryModel.create(categoryData)

      return category
    } catch (error) {
      throw error
    }
  }

  async get(id: Id): Promise<any> {
    try {
      const category = await CategoryModel.findById(id).select('-__v').lean()

      if (!category) throw new BadRequest('Category not found')

      return category
    } catch (error) {
      throw error
    }
  }

  async patch(id: any, data: any, params: any): Promise<any> {
    try {
      // Get the existing category before updating
      const existingCategory = await CategoryModel.findById(id).lean()
      if (!existingCategory) throw new BadRequest('Category not found')

      // Prepare category data to be updated
      let categoryData = { ...data }

      if (existingCategory.type === 'mainCategory') {
        categoryData = {
          ...data,
          subCategories: data.subCategories || existingCategory.subCategories || []
        }
      }

      // Update the category
      await CategoryModel.findByIdAndUpdate(id, categoryData)

      const updatedCategory = await CategoryModel.findById(id).lean()
      if (!updatedCategory) throw new BadRequest('Category not found after update')

      // Update subCategory references in main categories
      if (existingCategory.type === 'subCategory') {
        // Step 1: Remove this subcategory from any main categories it was previously associated with
        await CategoryModel.updateMany({ subCategories: id }, { $pull: { subCategories: id } })

        // Step 2: Add this subcategory ID to the specified main categories
        if (data.mainCategories?.length) {
          await CategoryModel.updateMany(
            { _id: { $in: data.mainCategories }, type: 'mainCategory' },
            { $addToSet: { subCategories: id } } // `addToSet` prevents duplicates
          )
        }
      }

      return updatedCategory
    } catch (error) {
      throw error
    }
  }

  async remove(id: any): Promise<any> {
    try {
      const category = await CategoryModel.findById(id).lean()

      if (!category) throw new BadRequest('Category not found')

      await CategoryModel.findByIdAndDelete(id)

      return category
    } catch (error) {
      throw error
    }
  }
}

export class ConsumerCategoriesService<
  ServiceParams extends Params = CategoriesParams
> extends MongoDBService<Categories, CategoriesData, CategoriesParams, CategoriesPatch> {
  async find(params?: CategoriesParams | any): Promise<any> {
    try {
      const { type, allMain } = params?.query

      if (type) return await CategoryModel.find({ type }).lean()

      let opts = {}
      if (!allMain) opts = { ...opts, showOnAppNavigation: true }

      const categories = await CategoryModel.find({
        type: 'mainCategory',
        isActive: true,
        ...opts
      })
        .populate('subCategories')
        .lean()

      return categories
    } catch (error) {
      throw error
    }
  }

  async get(id: Id): Promise<any> {
    try {
      const category = await CategoryModel.findById(id).select('-__v').populate('subCategories').lean()

      if (!category) throw new BadRequest('Category not found')

      return category
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('productCategories'))
  }
}
