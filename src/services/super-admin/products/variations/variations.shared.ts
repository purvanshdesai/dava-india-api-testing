// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../../../client'
import type {
  Variations,
  VariationsData,
  VariationsPatch,
  VariationsQuery,
  VariationsService
} from './variations.class'

export type { Variations, VariationsData, VariationsPatch, VariationsQuery }

export type VariationsClientService = Pick<
  VariationsService<Params<VariationsQuery>>,
  (typeof variationsMethods)[number]
>

export const variationsPath = '/super-admin/product-variations'

export const variationsMethods: Array<keyof VariationsService> = ['find', 'get', 'create', 'patch', 'remove']

export const variationsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(variationsPath, connection.service(variationsPath), {
    methods: variationsMethods
  })
}

// Add this service to the client service type index
declare module '../../../../client' {
  interface ServiceTypes {
    [variationsPath]: VariationsClientService
  }
}
