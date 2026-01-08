import { Type } from "@feathersjs/typebox"

const ImageObjectDetails = Type.Object({
  size: Type.Number(),
  fileName: Type.String(),
  originalFileName: Type.String(),
  mimeType: Type.String()
})

const ImageSchema = Type.Object({
  _id: Type.String(),
  storageService: Type.String(),
  objectDetails: ImageObjectDetails,
  objectUrl: Type.String()
})

const AboutProductSchema = Type.Object({
  info: Type.String(),
  suitableFor: Type.Array(Type.String()),
  dosage: Type.Array(Type.String()),
  cautions: Type.Array(Type.String()),
  benefits: Type.Array(Type.String()),
  sideEffects: Type.Array(Type.String()),
  productInfo: Type.String(),
  sellerInfo: Type.String(),
  manufacturerInfo: Type.String(),
  packagedByInfo: Type.String()
})

const SelectedSectionField = Type.Object({
  id: Type.String()
})

const SelectedSectionSchema = Type.Object({
  label: Type.String(),
  value: Type.String(),
  fieldArray: Type.Optional(
    Type.Object({
      fields: Type.Array(Type.Union([SelectedSectionField, Type.Object({ id: Type.String() })]))
    })
  )
})

const SeoSchema = Type.Object({
  url: Type.String(),
  metaTitle: Type.String(),
  metaDescription: Type.String(),
  keywords: Type.Array(Type.String())
})

const TranslationSchema = Type.Object({
  hi: Type.Optional(Type.String()),
  ta: Type.Optional(Type.String())
})

const AboutProductTranslationSchema = Type.Object({
  suitableFor: Type.Array(TranslationSchema),
  info: TranslationSchema,
  dosage: Type.Array(TranslationSchema),
  cautions: Type.Array(TranslationSchema)
})

const TranslationsSchema = Type.Object({
  title: Type.Optional(Type.Object({ hi: Type.String() })),
  aboutProduct: Type.Optional(AboutProductTranslationSchema)
})

const ProductSchemaSwagger = Type.Object({
  _id: Type.String(),
  title: Type.String(),
  description: Type.String(),
  compositions: Type.String(),
  searchSuggestionKeywords: Type.Array(Type.String()),
  tags: Type.Array(Type.String()),
  sku: Type.String(),
  seo: SeoSchema,
  unitPrice: Type.Number(),
  maximumRetailPrice: Type.Number(),
  discount: Type.Number(),
  finalPrice: Type.Number(),
  images: Type.Array(ImageSchema),
  thumbnail: Type.String(),
  associatedProducts: Type.Array(Type.String()),
  subCategoryId: Type.String(),
  isActive: Type.Boolean(),
  hasVariation: Type.Boolean(),
  aboutProduct: AboutProductSchema,
  taxes: Type.Array(Type.String()),
  variation: Type.Object({}),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  selectedSections: Type.Array(SelectedSectionSchema),
  translations: TranslationsSchema
})

export { ProductSchemaSwagger }
