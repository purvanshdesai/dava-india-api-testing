// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  MedicineRemainderModel,
  type MedicineRemainder,
  type MedicineRemainderData,
  type MedicineRemainderPatch,
  type MedicineRemainderQuery
} from './medicine-remainder.schema'
import { getDeliveryPolicyIdByZipCode } from '../../cachedResources/order/db/orderDB'
import { ObjectId } from 'mongodb'

export type { MedicineRemainder, MedicineRemainderData, MedicineRemainderPatch, MedicineRemainderQuery }

export interface MedicineRemainderParams extends MongoDBAdapterParams<MedicineRemainderQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class MedicineRemainderService<
  ServiceParams extends Params = MedicineRemainderParams
> extends MongoDBService<
  MedicineRemainder,
  MedicineRemainderData,
  MedicineRemainderParams,
  MedicineRemainderPatch
> {
  async create(data: any, params?: ServiceParams): Promise<any> {
    try {
      // Get userId from authenticated user
      const userId: any = params?.user?._id
      if (!userId) {
        throw new Error('User not authenticated')
      }
      const id = new ObjectId(userId)
      const productId = new ObjectId(data?.productId)
      const pincode = data.pincode?.toString().trim()

      const duplicates = await MedicineRemainderModel.aggregate([
        {
          $match: {
            userId: id, // Use string userId (as stored in DB)
            productId: productId,
            pincode: pincode,
            status: 'pending'
          }
        },
        { $limit: 1 } // just need to know if one exists
      ])

      if (duplicates.length > 0) {
        throw new Error('Medicine remainder already exists')
      }

      // Get deliveryPolicyId from pincode
      let deliveryPolicyId: any = null
      if (data.pincode) {
        deliveryPolicyId = await getDeliveryPolicyIdByZipCode(data.pincode)
      }

      // Create the medicine remainder with all required fields
      const medicineRemainderData = {
        ...data,
        userId,
        deliveryPolicyId: new ObjectId(deliveryPolicyId),
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      return super.create(medicineRemainderData)
    } catch (error) {
      console.error('Error creating medicine remainder:', error)
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('medicine-remainder'))
  }
}
