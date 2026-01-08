// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { Taxes, TaxesData, TaxesPatch, TaxesQuery, TaxesService } from './taxes.class'

export type { Taxes, TaxesData, TaxesPatch, TaxesQuery }

export type TaxesClientService = Pick<TaxesService<Params<TaxesQuery>>, (typeof taxesMethods)[number]>

export const taxesPath = 'taxes'

export const taxesMethods: Array<keyof TaxesService> = ['find', 'get', 'create', 'patch', 'remove']

export const taxesClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(taxesPath, connection.service(taxesPath), {
    methods: taxesMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [taxesPath]: TaxesClientService
  }
}
