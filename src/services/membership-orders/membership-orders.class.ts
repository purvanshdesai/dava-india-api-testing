// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  MembershipOrderModel,
  type MembershipOrders,
  type MembershipOrdersData,
  type MembershipOrdersPatch,
  type MembershipOrdersQuery
} from './membership-orders.schema'
import { createCheckoutSession } from './membership-orders.shared'
import { PAYMENT_GATEWAYS } from '../../payments'
import { membershipConfig } from '../memberships/memberships.shared'

export type { MembershipOrders, MembershipOrdersData, MembershipOrdersPatch, MembershipOrdersQuery }

export interface MembershipOrdersParams extends MongoDBAdapterParams<MembershipOrdersQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class MembershipOrdersService<
  ServiceParams extends Params = MembershipOrdersParams
> extends MongoDBService<
  MembershipOrders,
  MembershipOrdersData,
  MembershipOrdersParams,
  MembershipOrdersPatch
> {
  async create(data: MembershipOrdersData | any, params?: any): Promise<any> {
    try {
      const payload = {
        user: params?.user?._id,
        status: 'pending',
        paymentGateway: PAYMENT_GATEWAYS.PAYU,
        paymentAmount: membershipConfig.membershipAmount,
        deviceType: data?.deviceType ?? 'web',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const order = (await MembershipOrderModel.create(payload)).toObject()

      const paymentInfo = await createCheckoutSession({
        order,
        data: data,
        user: params?.user
      })

      return {
        ...order,
        paymentForm: paymentInfo?.paymentForm,
        paymentOrderId: paymentInfo?.id,
        paymentDetails: paymentInfo?.paymentDetails
      }
    } catch (error) {
      console.log(error)
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('membership-orders'))
  }
}
