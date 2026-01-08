// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  ReferralCredits,
  ReferralCreditsData,
  ReferralCreditsPatch,
  ReferralCreditsQuery,
  ReferralCreditsService
} from './referral-credits.class'

export type { ReferralCredits, ReferralCreditsData, ReferralCreditsPatch, ReferralCreditsQuery }

export type ReferralCreditsClientService = Pick<
  ReferralCreditsService<Params<ReferralCreditsQuery>>,
  (typeof referralCreditsMethods)[number]
>

export const referralCreditsPath = 'referral-credits'

export const referralCreditsMethods: Array<keyof ReferralCreditsService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const referralCreditsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(referralCreditsPath, connection.service(referralCreditsPath), {
    methods: referralCreditsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [referralCreditsPath]: ReferralCreditsClientService
  }
}
