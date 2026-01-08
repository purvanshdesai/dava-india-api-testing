// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Categories,
  CategoriesData,
  CategoriesPatch,
  CategoriesQuery,
  CategoriesService,
  ConsumerCategoriesService
} from './categories.class'

export type { Categories, CategoriesData, CategoriesPatch, CategoriesQuery }

export type CategoriesClientService = Pick<
  CategoriesService<Params<CategoriesQuery>>,
  (typeof categoriesMethods)[number]
>

export const consumerCategoriesPath = 'consumer/categories'
export const categoriesPath = 'categories'

export const categoriesMethods: Array<keyof CategoriesService> = ['find', 'get', 'create', 'patch', 'remove']

export const categoriesClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(categoriesPath, connection.service(categoriesPath), {
    methods: categoriesMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [categoriesPath]: CategoriesClientService
    [consumerCategoriesPath]: ConsumerCategoriesService
  }
}
