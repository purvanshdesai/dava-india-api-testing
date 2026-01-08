// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type {
  ApplicationTax,
  ApplicationTaxData,
  ApplicationTaxPatch,
  ApplicationTaxQuery
} from './application-tax.schema'

export type { ApplicationTax, ApplicationTaxData, ApplicationTaxPatch, ApplicationTaxQuery }

export interface ApplicationTaxParams extends MongoDBAdapterParams<ApplicationTaxQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class ApplicationTaxService<
  ServiceParams extends Params = ApplicationTaxParams
> extends MongoDBService<ApplicationTax, ApplicationTaxData, ApplicationTaxParams, ApplicationTaxPatch> {}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('application-tax'))
  }
}
