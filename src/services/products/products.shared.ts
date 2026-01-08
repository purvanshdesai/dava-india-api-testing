// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  ConsumerProducts,
  ConsumerProductsData,
  ConsumerProductsPatch,
  ConsumerProductsQuery,
  ProductsService
} from './products.class'

export type { ConsumerProducts, ConsumerProductsData, ConsumerProductsPatch, ConsumerProductsQuery }

export type ProductsClientService = Pick<
  ProductsService<Params<ConsumerProductsQuery>>,
  (typeof productsMethods)[number]
>

export const productsPath = 'products'
export const productsSeoPath = 'products/seo'
export const productPath = 'product'

export const productsMethods: Array<keyof ProductsService> = ['find', 'get']

export const consumerProductsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(productsPath, connection.service(productsPath), {
    methods: productsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [productsPath]: ProductsClientService
  }
}
