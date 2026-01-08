// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax, ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { ProductsService } from './products.class'
import { productSchemaFilter } from './SwaggerHelpers/FilterSchema'

// Main data model schema
export const productsSchema = Type.Object(
  {
    id: Type.Number(),
    category: Type.String({
      description: 'Category of the item',
      example: 'Electronics'
    }),
    sponsored: Type.String({
      description: 'Indicates if the item is sponsored or not',
      example: 'yes'
    }),
    filter: Type.Any({
      description:
        'Filter criteria for the item. This can be of any type, depending on the specific use case.',
      example: { color: 'red', priceRange: [100, 500] }
    }),
    page: Type.Optional(Type.Any()),
    limit: Type.Optional(Type.Any()),
    userId: Type.Optional(ObjectIdSchema()),
    cartSimilarProducts: Type.Optional(Type.Boolean())
  },
  { $id: 'ConsumerProducts', additionalProperties: false }
)
export type ConsumerProducts = Static<typeof productsSchema>
export const productsValidator = getValidator(productsSchema, dataValidator)
export const productsResolver = resolve<ConsumerProducts, HookContext<ProductsService>>({})

export const productsExternalResolver = resolve<ConsumerProducts, HookContext<ProductsService>>({})

// Schema for creating new entries
export const productsDataSchema = Type.Pick(productsSchema, ['category', 'filter', 'page', 'limit'], {
  $id: 'ConsumerProductsData'
})
export type ConsumerProductsData = Static<typeof productsDataSchema>
export const productsDataValidator = getValidator(productsDataSchema, dataValidator)
export const productsDataResolver = resolve<ConsumerProducts, HookContext<ProductsService>>({})

// Schema for updating existing entries
export const productsPatchSchema = Type.Partial(productsSchema, {
  $id: 'ConsumerProductsPatch'
})
export type ConsumerProductsPatch = Static<typeof productsPatchSchema>
export const productsPatchValidator = getValidator(productsPatchSchema, dataValidator)
export const productsPatchResolver = resolve<ConsumerProducts, HookContext<ProductsService>>({})

// Schema for allowed query properties
export const productsQueryProperties = Type.Pick(productsSchema, [
  'id',
  'category',
  'sponsored',
  'filter',
  'page',
  'limit',
  'cartSimilarProducts',
  'userId'
])
export const productsQueryProperties1 = Type.Pick(productSchemaFilter, [
  'id',
  'category',
  'sponsored',
  'filter'
])

export const productsQuerySchema = Type.Intersect(
  [
    querySyntax(productsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type ConsumerProductsQuery = Static<typeof productsQuerySchema>
export const productsQueryValidator = getValidator(productsQuerySchema, queryValidator)
export const productsQueryResolver = resolve<ConsumerProductsQuery, HookContext<ProductsService>>({})
