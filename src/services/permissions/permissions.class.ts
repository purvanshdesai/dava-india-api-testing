// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type { Permissions, PermissionsData, PermissionsPatch, PermissionsQuery } from './permissions.schema'

export type { Permissions, PermissionsData, PermissionsPatch, PermissionsQuery }

export interface PermissionsParams extends MongoDBAdapterParams<PermissionsQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class PermissionsService<ServiceParams extends Params = PermissionsParams> extends MongoDBService<
  Permissions,
  PermissionsData,
  PermissionsParams,
  PermissionsPatch
> {}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('permissions'))
  }
}
