// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  CollectionModel,
  type Collections,
  type CollectionsData,
  type CollectionsPatch,
  type CollectionsQuery
} from './collections.schema'
import { BadRequest } from '@feathersjs/errors'

export type { Collections, CollectionsData, CollectionsPatch, CollectionsQuery }

export interface CollectionsParams extends MongoDBAdapterParams<CollectionsQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class CollectionsService<ServiceParams extends Params = CollectionsParams> extends MongoDBService<
  Collections,
  CollectionsData,
  CollectionsParams,
  CollectionsPatch
> {
  async find(params?: CollectionsParams): Promise<any> {
    try {
      const query: any = params?.query

      if (!query || (typeof query === 'object' && Object.keys(query).length === 0)) {
        return await CollectionModel.find().lean()
      }

      // Extract pagination parameters
      const limit = parseInt(query.$limit) || 10 // Default limit to 10
      const skip = parseInt(query.$skip) || 0 // Default skip to 0

      // Find coupons based on the query with pagination
      const collections = await CollectionModel.find({
        ...query.query
      })
        .limit(limit) // Apply limit for pagination
        .skip(skip) // Apply skip for pagination
        .lean()

      // Count total number of matching documents for pagination info
      const total = await CollectionModel.countDocuments({ ...query.query })

      // Return the result with pagination data
      return {
        data: collections,
        total,
        limit,
        skip
      }
    } catch (error) {
      throw error
    }
  }

  async create(data: any, params?: CollectionsParams): Promise<any> {
    try {
      const collection = await super.create(data)
      return collection
    } catch (error) {
      throw error
    }
  }

  async get(id: any): Promise<any> {
    try {
      const collection = await CollectionModel.findById(id).lean()
      if (!collection) {
        throw new BadRequest('Collection not found')
      }

      return collection
    } catch (error) {
      throw error
    }
  }

  async patch(id: any, data: any, params: any): Promise<any> {
    try {
      const collection = await CollectionModel.findById(id).lean()

      if (!collection) throw new BadRequest('Collection not found')

      const updatedCollection = await CollectionModel.findByIdAndUpdate(id, { ...data })

      return updatedCollection
    } catch (error) {
      throw error
    }
  }

  // Delete (soft delete) method that sets archive field to true
  async remove(id: any): Promise<any> {
    try {
      const category = await CollectionModel.findById(id).lean()

      if (!category) throw new BadRequest('Category not found')

      await CollectionModel.findByIdAndDelete(id)

      return category
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('collections'))
  }
}
