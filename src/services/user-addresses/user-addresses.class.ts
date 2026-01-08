// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params, PaginationOptions } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type {
  UserAddresses,
  UserAddressesData,
  UserAddressesPatch,
  UserAddressesQuery
} from './user-addresses.schema'
import { userAddressModel } from './user-addresses.schema'
import { ZipCodesModel } from '../zip-codes/zip-codes.schema'

export type { UserAddresses, UserAddressesData, UserAddressesPatch, UserAddressesQuery }

export interface UserAddressesParams extends MongoDBAdapterParams<UserAddressesQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class UserAddressesService<ServiceParams extends Params = UserAddressesParams> extends MongoDBService<
  UserAddresses,
  UserAddressesData,
  UserAddressesParams,
  UserAddressesPatch
> {
  async validateZipCode(zipCode: string): Promise<any> {
    // validate zipcode
    const res = await ZipCodesModel.findOne({ zipCode: zipCode }).lean()
    if (!res)
      return { invalidZipCode: true, message: `Postal code ${zipCode} is not available in our system!` }

    return res
  }

  async create(data: UserAddressesData | any, params?: ServiceParams): Promise<any> {
    // validate zipcode
    const res: any = await this.validateZipCode(data?.postalCode)

    if (res?.invalidZipCode) return res

    const address = await super.create(data, params)

    if (address.isDefault)
      await userAddressModel.updateMany({ _id: { $nin: [address?._id] } }, { isDefault: false })

    return address
  }

  async patch(id: unknown, data: UserAddressesData | any, params?: unknown): Promise<any> {
    // validate zipcode
    const res: any = await this.validateZipCode(data?.postalCode)
    if (res?.invalidZipCode) return res

    return await userAddressModel.findByIdAndUpdate(id, data).lean()
  }

  async find(
    params?: (UserAddressesParams & { paginate?: PaginationOptions }) | undefined | any
  ): Promise<any> {
    const userId = params?.user?._id
    return await userAddressModel.find({ userId: userId }).lean()
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('user-addresses'))
  }
}
