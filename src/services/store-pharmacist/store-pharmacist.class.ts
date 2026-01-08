// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  StorePharmacistModel,
  type StorePharmacist,
  type StorePharmacistData,
  type StorePharmacistPatch,
  type StorePharmacistQuery
} from './store-pharmacist.schema'
import { BadRequest } from '@feathersjs/errors'

export type { StorePharmacist, StorePharmacistData, StorePharmacistPatch, StorePharmacistQuery }

export interface StorePharmacistParams extends MongoDBAdapterParams<StorePharmacistQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class StorePharmacistService<
  ServiceParams extends Params = StorePharmacistParams
> extends MongoDBService<StorePharmacist, StorePharmacistData, StorePharmacistParams, StorePharmacistPatch> {
  async find(params?: StorePharmacistParams): Promise<any> {
    try {
      const query: any = params?.query

      if (!query?.store) {
        throw new BadRequest('Store id not available')
      }

      const res = await StorePharmacistModel.find({ store: query?.store, archive: false }).lean()

      return res?.length ? res : []
    } catch (error) {
      throw error
    }
  }

  async create(data: any, params?: StorePharmacistParams): Promise<any> {
    try {
      const alreadyExist = await StorePharmacistModel.findOne({ pin: data?.pin }).lean()

      if (alreadyExist) throw new Error('Pin already exist for other user')

      const pharmacist = await super.create({ ...data, archive: false })

      return pharmacist
    } catch (error) {
      throw error
    }
  }

  async patch(id: any, data: any, params: any): Promise<any> {
    try {
      const pharmacist = await StorePharmacistModel.findById(id).lean()

      if (!pharmacist) throw new BadRequest('Pharmacist not found')

      // Remove __v and other mongoose internal fields that cause validation errors
      const { __v, ...cleanData } = data

      const updatedPharmacist = await StorePharmacistModel.findByIdAndUpdate(id, cleanData, { new: true })

      return updatedPharmacist
    } catch (error) {
      throw error
    }
  }

  // Delete (soft delete) method that sets archive field to true
  async remove(id: any): Promise<any> {
    try {
      const pharmacist = await StorePharmacistModel.findById(id).lean()

      if (!pharmacist) throw new BadRequest('Pharmacist not found')

      await StorePharmacistModel.findByIdAndUpdate(id, { $set: { archive: true } })

      return pharmacist
    } catch (error) {
      throw error
    }
  }
}
export class StorePharmacistStoreAdminService<
  ServiceParams extends Params = StorePharmacistParams
> extends MongoDBService<StorePharmacist, StorePharmacistData, StorePharmacistParams, StorePharmacistPatch> {
  async find(params?: StorePharmacistParams): Promise<any> {
    try {
      const query: any = params?.query

      if (!query?.store) {
        throw new BadRequest('Store id not available')
      }
      if (!query?.pin) {
        throw new BadRequest('Please provide proper pin')
      }

      const res = await StorePharmacistModel.findOne({
        store: query?.store,
        pin: query?.pin,
        archive: false
      }).lean()

      if (res) return { success: true, data: res }
      else return { success: false }
    } catch (error) {
      throw error
    }
  }

  async get(id: any): Promise<any> {
    try {
      const pharmacist = await StorePharmacistModel.findById(id).lean()
      if (!pharmacist) {
        throw new BadRequest('Pharmacist not found')
      }

      return pharmacist
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('store-pharmacist'))
  }
}
