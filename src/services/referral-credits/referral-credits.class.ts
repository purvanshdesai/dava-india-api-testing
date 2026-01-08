// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type {
  ReferralCredits,
  ReferralCreditsData,
  ReferralCreditsPatch,
  ReferralCreditsQuery
} from './referral-credits.schema'

export type { ReferralCredits, ReferralCreditsData, ReferralCreditsPatch, ReferralCreditsQuery }

export interface ReferralCreditsParams extends MongoDBAdapterParams<ReferralCreditsQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class ReferralCreditsService<
  ServiceParams extends Params = ReferralCreditsParams
> extends MongoDBService<ReferralCredits, ReferralCreditsData, ReferralCreditsParams, ReferralCreditsPatch> {}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('referral-credits'))
  }
}
