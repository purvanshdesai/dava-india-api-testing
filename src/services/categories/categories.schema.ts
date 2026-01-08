// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { CategoriesService } from './categories.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

export const CONSTANTS = {
  TYPE: {
    MAIN_CATEGORY: 'mainCategory',
    SUB_CATEGORY: 'subCategory'
  },
  IS_ACTIVE: { ACTIVE: 'active', IN_ACTIVE: 'inactive' }
}
// Main data model schema
export const categoriesSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    name: Type.String(),
    subCategories: Type.Optional(Type.Array(ModelObjectId({ mongoose: { ref: 'categories' } }))),
    mainCategories: Type.Optional(Type.Array(ModelObjectId({ mongoose: { ref: 'categories' } }))),
    type: StringEnum(Object.values(CONSTANTS.TYPE)),
    description: Type.String(),
    image: Type.Any(),
    displayOrder: Type.Number(),
    seo: Type.Any(),
    slugUrl: Type.String(),
    isActive: Type.Boolean(),
    translations: Type.Any(),
    showOnAppNavigation: Type.Optional(Type.Boolean()),
    backGroundColor: Type.Optional(Type.String()),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' })),
    $paginate: Type.Optional(Type.Boolean()),
    query: Type.Any()
  },
  { $id: 'Categories', additionalProperties: false }
)
export type Categories = Static<typeof categoriesSchema>
export const categoriesValidator = getValidator(categoriesSchema, dataValidator)
export const categoriesResolver = resolve<Categories, HookContext<CategoriesService>>({})

export const categoriesExternalResolver = resolve<Categories, HookContext<CategoriesService>>({})

// Schema for creating new entries
export const categoriesDataSchema = Type.Omit(
  categoriesSchema,
  ['_id', 'query', 'createdAt', 'updatedAt', '$paginate'],
  {
    $id: 'CategoriesData'
  }
)
export type CategoriesData = Static<typeof categoriesDataSchema>
export const categoriesDataValidator = getValidator(categoriesDataSchema, dataValidator)
export const categoriesDataResolver = resolve<Categories, HookContext<CategoriesService>>({})

// Schema for updating existing entries
export const categoriesPatchSchema = Type.Partial(categoriesSchema, {
  $id: 'CategoriesPatch'
})
export type CategoriesPatch = Static<typeof categoriesPatchSchema>
export const categoriesPatchValidator = getValidator(categoriesPatchSchema, dataValidator)
export const categoriesPatchResolver = resolve<Categories, HookContext<CategoriesService>>({})

// Schema for allowed query properties
export const categoriesQueryProperties = Type.Pick(categoriesSchema, ['query', '$paginate', 'type'])
export const categoriesQuerySchema = Type.Intersect(
  [
    querySyntax(categoriesQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: true })
  ],
  { additionalProperties: true }
)
export type CategoriesQuery = Static<typeof categoriesQuerySchema>
export const categoriesQueryValidator = getValidator(categoriesQuerySchema, queryValidator)
export const categoriesQueryResolver = resolve<CategoriesQuery, HookContext<CategoriesService>>({})

export const CategoryDb = Type.Omit(categoriesSchema, ['_id', 'query'], { $id: 'CategoryDb' })

export type TCategoryDb = Static<typeof categoriesDataSchema>

const mongooseSchema = typeboxToMongooseSchema(CategoryDb)
export const CategoryModel = makeMongooseModel('categories', mongooseSchema)
