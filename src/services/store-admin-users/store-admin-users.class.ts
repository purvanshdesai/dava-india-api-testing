// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type {
  StoreAdminUsers,
  StoreAdminUsersData,
  StoreAdminUsersPatch,
  StoreAdminUsersQuery
} from './store-admin-users.schema'

export type { StoreAdminUsers, StoreAdminUsersData, StoreAdminUsersPatch, StoreAdminUsersQuery }

export interface StoreAdminUsersParams extends MongoDBAdapterParams<StoreAdminUsersQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class StoreAdminUsersService<
  ServiceParams extends Params = StoreAdminUsersParams
> extends MongoDBService<StoreAdminUsers, StoreAdminUsersData, StoreAdminUsersParams, StoreAdminUsersPatch> {}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('store-admin-users'))
  }
}
