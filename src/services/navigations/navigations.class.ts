// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  NavigationsModel,
  type Navigations,
  type NavigationsData,
  type NavigationsPatch,
  type NavigationsQuery
} from './navigations.schema'
import { BadRequest } from '@feathersjs/errors'
import { CollectionModel } from '../collections/collections.schema'

export type { Navigations, NavigationsData, NavigationsPatch, NavigationsQuery }

export interface NavigationsParams extends MongoDBAdapterParams<NavigationsQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class NavigationsService<ServiceParams extends Params = NavigationsParams> extends MongoDBService<
  Navigations,
  NavigationsData,
  NavigationsParams,
  NavigationsPatch
> {
  async create(data: any, params?: NavigationsParams): Promise<any> {
    try {
      const navigation = await super.create(data)
      return navigation
    } catch (error) {
      throw error
    }
  }

  async find(params?: NavigationsParams): Promise<any> {
    try {
      const level1 = await NavigationsModel.find({ level: 1 })
        .sort({ position: 1 })
        .populate('collection')
        .lean()

      return await Promise.all(
        level1?.map(async (l1) => {
          const level2 = await NavigationsModel.find({ level: 2, parentMenu: l1._id })
            .populate('collection')
            .lean()

          const level2Items = await Promise.all(
            level2?.map(async (l2: any) => {
              return {
                ...l2,
                items: await NavigationsModel.find({ level: 3, parentMenu: l2._id })
                  .populate('collection')
                  .lean()
              }
            })
          )

          return { ...l1, items: level2Items }
        })
      )
    } catch (error) {
      throw error
    }
  }

  async remove(id: any): Promise<any> {
    try {
      const navigation = await NavigationsModel.findById(id).lean()

      if (!navigation) throw new BadRequest('Navigation not found')

      const removeNavigation = async (id: any) => {
        const n: any = await NavigationsModel.findByIdAndDelete(id).select('_id level').lean()

        if (n.level == 1) {
          const subNavigations = await NavigationsModel.find({ level: 2, parentMenu: n?._id }).lean()

          await Promise.all(
            subNavigations?.map(async (i) => {
              await removeNavigation(i?._id)
            })
          )
        }

        if (n.level == 2) await NavigationsModel.deleteMany({ level: 3, parentMenu: n?._id }).lean()
      }

      await removeNavigation(id)
      return navigation
    } catch (error) {
      throw error
    }
  }
}

export class ConsumerNavigationsService<
  ServiceParams extends Params = NavigationsParams
> extends MongoDBService<Navigations, NavigationsData, NavigationsParams, NavigationsPatch> {
  async find(params?: NavigationsParams): Promise<any> {
    try {
      const level1 = await NavigationsModel.find({ level: 1 })
        .sort({ position: 1 })
        .populate('collection')
        .select('collection')
        .lean()

      return await Promise.all(
        level1?.map(async (l1: any) => {
          const level2 = await NavigationsModel.find({ level: 2, parentMenu: l1._id })
            .populate('collection')
            .select('collection')
            .lean()

          const level2Items = await Promise.all(
            level2?.map(async (l2: any) => {
              const level3Items = await NavigationsModel.find({ level: 3, parentMenu: l2._id })
                .populate('collection')
                .select('collection')
                .lean()

              return {
                ...l2?.collection,
                items: level3Items?.map((i) => i?.collection)
              }
            })
          )

          return { ...(l1?.collection ?? {}), items: level2Items }
        })
      )
    } catch (error) {
      throw error
    }
  }
}

export class ConsumerCollectionNavigationsService<
  ServiceParams extends Params = NavigationsParams
> extends MongoDBService<Navigations, NavigationsData, NavigationsParams, NavigationsPatch> {
  async find(params?: NavigationsParams | any): Promise<any> {
    try {
      const { collectionId } = params?.query

      const collection = await CollectionModel.findById(collectionId).select('_id slugUrl').lean()

      if (!collection) throw new BadRequest('Invalid collection!')

      const navigation: any = await NavigationsModel.findOne({ collection: collection._id }).lean()

      if (!navigation) return [collection.slugUrl]

      switch (navigation.level) {
        case 1:
          return [collection.slugUrl]

        case 2: {
          const mainNav: any = await this.fetchNavigationWithCollection(navigation.parentMenu)
          return [mainNav?.collection?.slugUrl, collection.slugUrl]
        }

        case 3: {
          const subNav: any = await this.fetchNavigationWithCollection(navigation.parentMenu)
          const mainNav: any = await this.fetchNavigationWithCollection(subNav?.parentMenu as string)
          return [mainNav?.collection?.slugUrl, subNav?.collection?.slugUrl, collection.slugUrl]
        }

        default:
          throw new BadRequest('Invalid navigation level!')
      }
    } catch (error) {
      throw error
    }
  }
  async fetchNavigationWithCollection(navigationId: string) {
    return NavigationsModel.findById(navigationId)
      .populate('collection', '_id slugUrl') // Only fetch necessary fields
      .select('collection parentMenu')
      .lean()
  }
}

export class ConsumerCollectionNavigationsServiceForMobile<
  ServiceParams extends Params = NavigationsParams
> extends MongoDBService<Navigations, NavigationsData, NavigationsParams, NavigationsPatch> {
  async find(params?: NavigationsParams | any): Promise<any> {
    try {
      const { slug_url } = params?.query

      const collection: any = await CollectionModel.findOne({ slugUrl: slug_url }).lean()

      if (!collection) throw new BadRequest('Invalid collection!')

      const navigation: any = await NavigationsModel.findOne({
        collection: collection?._id
      }).lean()

      if (!navigation) return [collection.slugUrl]
      else {
        const mainNav: any = await this.fetchNavigationWithCollection1(navigation._id)
        return mainNav
      }
    } catch (error) {
      throw error
    }
  }
  async fetchNavigationWithCollection1(navigationId: string) {
    return NavigationsModel.find({ parentMenu: navigationId })
      .populate('collection') // Only fetch necessary fields
      .sort({ position: 1 })
      .select('collection parentMenu')
      .lean()
  }
}

export class NavigationLayoutPositioningService<
  ServiceParams extends Params = NavigationsParams
> extends MongoDBService<Navigations, NavigationsData, NavigationsParams, NavigationsPatch> {
  async create(layouts: any, _params?: NavigationsParams): Promise<any> {
    try {
      const bulkOperations = layouts?.map(({ _id, position }: { _id: string; position: number }) => ({
        updateOne: {
          filter: { _id }, // Assuming `id` maps to `_id` in your collection
          update: { $set: { position } }
        }
      }))

      await NavigationsModel.bulkWrite(bulkOperations)

      return { message: 'Re Ordered Success!' }
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('navigations'))
  }
}
