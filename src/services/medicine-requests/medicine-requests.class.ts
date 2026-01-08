// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Id, Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  MedicineRequestsModel,
  type MedicineRequests,
  type MedicineRequestsData,
  type MedicineRequestsPatch,
  type MedicineRequestsQuery
} from './medicine-requests.schema'
import { BadRequest } from '@feathersjs/errors'
import { generateRunningRequestNo } from './medicine-requests.shared'

export type { MedicineRequests, MedicineRequestsData, MedicineRequestsPatch, MedicineRequestsQuery }

export interface MedicineRequestsParams extends MongoDBAdapterParams<MedicineRequestsQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class MedicineRequestsService<
  ServiceParams extends Params = MedicineRequestsParams
> extends MongoDBService<
  MedicineRequests,
  MedicineRequestsData,
  MedicineRequestsParams,
  MedicineRequestsPatch
> {
  // consumer related api's
  async create(data: any, params?: MedicineRequestsParams): Promise<any> {
    try {
      const payload = {
        ...data,
        requestedUserId: params?.user?._id,
        status: 'open',
        requestNo: await generateRunningRequestNo()
      }

      const request = await MedicineRequestsModel.create(payload)
      return request?.toObject()
    } catch (error) {
      throw error
    }
  }
}

export class MedicineRequestsAdminService<
  ServiceParams extends Params = MedicineRequestsParams
> extends MongoDBService<
  MedicineRequests,
  MedicineRequestsData,
  MedicineRequestsParams,
  MedicineRequestsPatch
> {
  async find(params?: MedicineRequestsParams): Promise<any> {
  try {
    const query: any = params?.query

    const limit = query?.$limit ? parseInt(query.$limit) : 10
    const skip = query?.$skip ? parseInt(query.$skip) : 0

    const baseQuery = query?.$or ? { $or: query.$or } : {}

    const MedicineRequests = await MedicineRequestsModel.find({ ...baseQuery })
      .populate('requestedUserId', 'name email phoneNumber')
      .sort({ _id: -1 })
      .limit(limit)
      .skip(skip)
      .lean()

    const total = await MedicineRequestsModel.countDocuments({ ...baseQuery })

    return { data: MedicineRequests, total, limit, skip }
  } catch (error) {
    throw error
  }
}


  async get(id: Id) {
    try {
      const request = await MedicineRequestsModel.findById(id)
        .populate('requestedUserId', 'name email phoneNumber')
        .lean()

      if (!request) throw new BadRequest('Not found')
      return { ...request, requestedUser: request.requestedUserId }
    } catch (error) {
      throw error
    }
  }
  async patch(id: any, data: any, params: any): Promise<any> {
    try {
      const MedicineRequests = await MedicineRequestsModel.findById(id).lean()

      if (!MedicineRequests) throw new BadRequest('Medicine Requests not found')

      const updatedMedicineRequests = await MedicineRequestsModel.findByIdAndUpdate(id, { ...data })

      return updatedMedicineRequests
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('medicine-requests'))
  }
}
