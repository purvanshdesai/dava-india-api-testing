// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  ApplicationTax,
  ApplicationTaxData,
  ApplicationTaxPatch,
  ApplicationTaxQuery,
  ApplicationTaxService
} from './application-tax.class'

export type { ApplicationTax, ApplicationTaxData, ApplicationTaxPatch, ApplicationTaxQuery }

export type ApplicationTaxClientService = Pick<
  ApplicationTaxService<Params<ApplicationTaxQuery>>,
  (typeof applicationTaxMethods)[number]
>

export const applicationTaxPath = 'application-tax'

export const applicationTaxMethods: Array<keyof ApplicationTaxService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const applicationTaxClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(applicationTaxPath, connection.service(applicationTaxPath), {
    methods: applicationTaxMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [applicationTaxPath]: ApplicationTaxClientService
  }
}
