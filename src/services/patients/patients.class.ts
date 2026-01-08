// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { PaginationOptions, Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  PatientsModel,
  type Patients,
  type PatientsData,
  type PatientsPatch,
  type PatientsQuery
} from './patients.schema'
import { BadRequest, Forbidden } from '@feathersjs/errors'

export type { Patients, PatientsData, PatientsPatch, PatientsQuery }

export interface PatientsParams extends MongoDBAdapterParams<PatientsQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class PatientsService<ServiceParams extends Params = PatientsParams> extends MongoDBService<
  Patients,
  PatientsData,
  PatientsParams,
  PatientsPatch
> {
  async create(data: any, params?: PatientsParams): Promise<any> {
    try {
      const userId = params?.user?._id

      const patient = await super.create({ ...data, userId: userId })

      return patient
    } catch (error) {
      throw error
    }
  }

  async find(params?: (PatientsParams & { paginate?: PaginationOptions }) | undefined | any): Promise<any> {
    try {
      const userId = params?.user?._id

      return await PatientsModel.find({
        userId: userId,
        $or: [{ deleted: false }, { deleted: { $exists: false } }]
      }).lean()
    } catch (error) {
      throw error
    }
  }

  async get(id: any, params?: PatientsParams): Promise<any> {
    try {
      const userId = params?.user?._id

      const patient = await PatientsModel.findById(id).lean()

      if (!patient) throw new BadRequest('Patient not found')

      if (patient?.userId?.toString() !== userId?.toString())
        throw new Forbidden('You are not authorized to access this patient')

      return patient
    } catch (error) {
      throw error
    }
  }

  async patch(id: any, data: any, params?: PatientsParams): Promise<any> {
    try {
      const userId = params?.user?._id

      const patient = await PatientsModel.findById(id).lean()

      if (!patient) throw new BadRequest('Patient not found')

      if (patient?.userId?.toString() !== userId?.toString())
        throw new Forbidden('You are not authorized to access this patient')

      return await PatientsModel.findByIdAndUpdate(id, { ...data })
    } catch (error) {
      throw error
    }
  }

  async remove(id: any, params?: PatientsParams): Promise<any> {
    try {
      const userId = params?.user?._id

      const patient = await PatientsModel.findById(id).lean()

      if (!patient) throw new BadRequest('Patient not found')

      if (patient?.userId?.toString() !== userId?.toString())
        throw new Forbidden('You are not authorized to access this patient')

      await PatientsModel.findByIdAndUpdate(id, { $set: { deleted: true } })

      return patient
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('patients'))
  }
}
