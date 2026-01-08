// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  MembershipModel,
  type Memberships,
  type MembershipsData,
  type MembershipsPatch,
  type MembershipsQuery
} from './memberships.schema'

export type { Memberships, MembershipsData, MembershipsPatch, MembershipsQuery }

export interface MembershipsParams extends MongoDBAdapterParams<MembershipsQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class MembershipsService<ServiceParams extends Params = MembershipsParams> extends MongoDBService<
  Memberships,
  MembershipsData,
  MembershipsParams,
  MembershipsPatch
> {
  async find(params?: MembershipsParams): Promise<any> {
    try {
      const userId = params?.user?._id

      const membership = await MembershipModel.findOne({ user: userId }).lean()

      return { hasMembership: membership ? true : false, membership }
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('memberships'))
  }
}
