// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  ModulesModel,
  type Modules,
  type ModulesData,
  type ModulesPatch,
  type ModulesQuery
} from './modules.schema'

export type { Modules, ModulesData, ModulesPatch, ModulesQuery }

export interface ModulesParams extends MongoDBAdapterParams<ModulesQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class ModulesService<ServiceParams extends Params = ModulesParams> extends MongoDBService<
  Modules,
  ModulesData,
  ModulesParams,
  ModulesPatch
> {
  async find(params?: ModulesParams): Promise<any> {
    try {
      const { query }: any = params || {}
      const modules = await ModulesModel.find(query).populate('permissions').lean()
      return modules
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('modules'))
  }
}
