// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax, StringEnum } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../../declarations'
import { dataValidator, queryValidator } from '../../../validators'
import type { ProductsService } from './products.class'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../../utils/mongoose'
import { ModelObjectId } from '../../../utils'

// Main data model schema
export const productsDbSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    productId: Type.Optional(Type.String()),
    title: Type.String(),
    hasVariation: Type.Boolean(),
    variationId: Type.Optional(ObjectIdSchema()),
    aboutProduct: Type.Object({
      info: Type.Optional(Type.String()),
      suitableFor: Type.Optional(Type.Array(Type.String())),
      dosage: Type.Optional(Type.Array(Type.String())),
      cautions: Type.Optional(Type.Array(Type.String())),
      sideEffects: Type.Optional(Type.Array(Type.String())),
      benefits: Type.Optional(Type.Array(Type.String())),
      productInfo: Type.Optional(Type.String()),
      sellerInfo: Type.Optional(Type.String()),
      manufacturerInfo: Type.Optional(Type.String()),
      packagedByInfo: Type.Optional(Type.String()),
      directionsForUse: Type.Optional(Type.String()),
      drugInteraction: Type.Optional(Type.String())
    }),
    description: Type.String(),
    moleculesUsed: Type.Optional(Type.Array(ObjectIdSchema())),
    compositions: Type.String(),
    tags: Type.Optional(Type.Array(Type.String())),
    brandTags: Type.Optional(Type.Array(Type.String())),
    variation: Type.Record(Type.String(), Type.String()),
    sku: Type.String(),
    seo: Type.Object({}),
    unitPrice: Type.Number(),
    maximumRetailPrice: Type.Number(),
    minOrderQuantity: Type.Optional(Type.Number()),
    maxOrderQuantity: Type.Optional(Type.Number()),
    discount: Type.Number(),
    discountType: StringEnum(['flat', 'percentage']),
    finalPrice: Type.Number(),
    images: Type.Array(Type.Record(Type.String(), Type.Any())),
    thumbnail: Type.String(),
    bannerImage: Type.Optional(Type.Record(Type.String(), Type.Any())),
    associatedProducts: Type.Optional(Type.Array(ModelObjectId({ mongoose: { ref: 'products' } }))),
    // featuredListId: Type.Optional(ObjectIdSchema()),
    featuredListId: Type.Optional(ModelObjectId({ mongoose: { ref: 'categories' } })),
    promotionId: Type.Optional(ObjectIdSchema()),
    subCategoryId: Type.Optional(ModelObjectId({ mongoose: { ref: 'categories' } })),
    isActive: Type.Boolean(),
    prescriptionReq: Type.Optional(Type.Boolean()),
    taxes: Type.Optional(Type.Array(ModelObjectId({ mongoose: { ref: 'taxes' } }))),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' })),
    translations: Type.Optional(Type.Any()),
    selectedSections: Type.Optional(Type.Any()),
    collections: Type.Optional(Type.Array(ModelObjectId({ mongoose: { ref: 'collections' } }))),
    hsnNumber: Type.Optional(Type.Any()),
    consumption: Type.Optional(Type.Union([ModelObjectId({ mongoose: { ref: 'app-data' } }), Type.Null()])),
    scheduledDrug: Type.Optional(Type.String()),
    saltType: Type.Optional(StringEnum(['None', 'Single Salt', 'Multi Salt'])),
    deleted: Type.Optional(Type.Boolean())
  },
  { $id: 'Products', additionalProperties: true }
)

export const productsSchema = Type.Pick(
  productsDbSchema,
  [
    '_id',
    'productId',
    'title',
    'hasVariation',
    'variationId',
    'aboutProduct',
    'description',
    'moleculesUsed',
    'compositions',
    'tags',
    'brandTags',
    'variation',
    'sku',
    'seo',
    'unitPrice',
    'maximumRetailPrice',
    'minOrderQuantity',
    'maxOrderQuantity',
    'discount',
    'discountType',
    'finalPrice',
    'images',
    'thumbnail',
    'associatedProducts',
    'featuredListId',
    'promotionId',
    'subCategoryId',
    'isActive',
    'taxes',
    'createdAt',
    'updatedAt',
    'translations',
    'prescriptionReq',
    'selectedSections',
    'collections',
    'hsnNumber',
    'consumption',
    'scheduledDrug',
    'saltType',
    'deleted'
  ],
  {
    $id: 'ProductsService'
  }
)
export type Products = Static<typeof productsSchema>
export const productsValidator = getValidator(productsSchema, dataValidator)
export const productsResolver = resolve<Products, HookContext<ProductsService>>({})

export const productsExternalResolver = resolve<Products, HookContext<ProductsService>>({})

// Schema for creating new entries
export const productsDataSchema = Type.Pick(
  productsSchema,
  [
    'productId',
    'title',
    'hasVariation',
    'variationId',
    'aboutProduct',
    'description',
    'moleculesUsed',
    'compositions',
    'tags',
    'brandTags',
    'variation',
    'sku',
    'seo',
    'unitPrice',
    'maximumRetailPrice',
    'minOrderQuantity',
    'maxOrderQuantity',
    'discount',
    'discountType',
    'finalPrice',
    'images',
    'thumbnail',
    'associatedProducts',
    'featuredListId',
    'subCategoryId',
    'promotionId',
    'isActive',
    'taxes',
    'createdAt',
    'updatedAt',
    'translations',
    'selectedSections',
    'prescriptionReq',
    'collections',
    'hsnNumber',
    'consumption',
    'scheduledDrug',
    'saltType',
    'deleted'
  ],
  {
    $id: 'ProductsData'
  }
)
export type ProductsData = Static<typeof productsDataSchema>
export const productsDataValidator = getValidator(productsDataSchema, dataValidator)
export const productsDataResolver = resolve<Products, HookContext<ProductsService>>({})

// Schema for updating existing entries
export const productsPatchSchema = Type.Partial(productsSchema, {
  $id: 'ProductsPatch'
})
export type ProductsPatch = Static<typeof productsPatchSchema>
export const productsPatchValidator = getValidator(productsPatchSchema, dataValidator)
export const productsPatchResolver = resolve<Products, HookContext<ProductsService>>({})

// Schema for allowed query properties
export const productsQueryProperties = Type.Pick(productsSchema, ['title', 'sku', 'createdAt', 'collections'])
export const productsQuerySchema = Type.Intersect(
  [
    querySyntax(productsQueryProperties, {
      title: { $regex: Type.String(), $options: Type.String() },
      sku: { $regex: Type.String(), $options: Type.String() },
      createdAt: { $sort: Type.Number() }
    }),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: true })
  ],
  { additionalProperties: true }
)
export type ProductsQuery = Static<typeof productsQuerySchema>
export const productsQueryValidator = getValidator(productsQuerySchema, queryValidator)
export const productsQueryResolver = resolve<ProductsQuery, HookContext<ProductsService>>({})

export const productsDb = Type.Pick(
  productsSchema,
  [
    'productId',
    'title',
    'hasVariation',
    'variationId',
    'aboutProduct',
    'description',
    'moleculesUsed',
    'compositions',
    'tags',
    'brandTags',
    'variation',
    'sku',
    'seo',
    'unitPrice',
    'maximumRetailPrice',
    'minOrderQuantity',
    'maxOrderQuantity',
    'discount',
    'discountType',
    'finalPrice',
    'images',
    'thumbnail',
    'associatedProducts',
    'featuredListId',
    'promotionId',
    'subCategoryId',
    'isActive',
    'taxes',
    'createdAt',
    'updatedAt',
    'translations',
    'selectedSections',
    'prescriptionReq',
    'collections',
    'hsnNumber',
    'consumption',
    'scheduledDrug',
    'saltType',
    'deleted'
  ],
  {
    $id: 'productsDb'
  }
)

const mongooseSchema = typeboxToMongooseSchema(productsDb)

export const ProductsModel = makeMongooseModel('products', mongooseSchema)
