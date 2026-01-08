// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../../declarations'
import type {
  SuperAdminUsersDeleteStore,
  SuperAdminUsersDeleteStoreData,
  SuperAdminUsersDeleteStorePatch,
  SuperAdminUsersDeleteStoreQuery
} from './delete-store.schema'
import { StoreModel } from '../../stores/stores.schema'
import { BadRequest } from '@feathersjs/errors'
import { StoreAdminUserModal } from '../../store-admin-users/store-admin-users.schema'

export type {
  SuperAdminUsersDeleteStore,
  SuperAdminUsersDeleteStoreData,
  SuperAdminUsersDeleteStorePatch,
  SuperAdminUsersDeleteStoreQuery
}

export interface SuperAdminUsersDeleteStoreServiceOptions {
  app: Application
}

export interface SuperAdminUsersDeleteStoreParams extends Params<SuperAdminUsersDeleteStoreQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class SuperAdminUsersDeleteStoreService {
  constructor(public options: SuperAdminUsersDeleteStoreServiceOptions) {}

  async find() {}

  async get() {}

  async create() {}

  // This method has to be added to the 'methods' option to make it available to clients
  async update() {}

  async patch() {}

  async remove(id: Id) {
    try {
      const store = await StoreModel.findById(id).lean()
      if (!store) throw new BadRequest('')
      await StoreModel.findByIdAndUpdate(id, {
        deleted: true,
        email: 'deleted_' + store.email
      })
      await StoreAdminUserModal.findOneAndUpdate(
        { email: store.email },
        {
          email: 'deleted_' + store.email
        }
      )
      return {
        message: 'Store deleted'
      }
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
