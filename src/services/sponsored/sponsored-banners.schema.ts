// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { SponsoredBannerService } from './sponsored.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

export const CONSTANTS = {
  REDIRECTION_TYPE: {
    COLLECTION: 'collection',
    EXTERNAL_LINK: 'externalLink',
    NONE: 'none'
  }
}

// Main data model schema
export const sponsoredBannerSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    sponsoredId: ModelObjectId({ mongoose: { ref: 'sponsored' } }),
    title: Type.String(),
    startDate: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
    endDate: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
    isActive: Type.Boolean({ default: true }),
    properties: Type.Object({
      redirectType: StringEnum([
        CONSTANTS.REDIRECTION_TYPE.COLLECTION,
        CONSTANTS.REDIRECTION_TYPE.EXTERNAL_LINK,
        CONSTANTS.REDIRECTION_TYPE.NONE
      ]),
      collection: Type.Union([ModelObjectId({ mongoose: { ref: 'collections' } }), Type.Null()]),
      redirectUrl: Type.Optional(Type.String())
    }),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
    device: Type.Object({
      desktop: Type.Any(),
      tablet: Type.Optional(Type.Any()),
      mobile: Type.Any()
    }),
    type: Type.Optional(Type.Any()),
    translations: Type.Optional(Type.Any())
  },
  { $id: 'SponsoredBanners', additionalProperties: false }
)
export type SponsoredBanner = Static<typeof sponsoredBannerSchema>
export const sponsoredBannerValidator = getValidator(sponsoredBannerSchema, dataValidator)
export const sponsoredBannerResolver: any = resolve<SponsoredBanner, HookContext<SponsoredBannerService>>({})

export const sponsoredBannerExternalResolver: any = resolve<
  SponsoredBanner,
  HookContext<SponsoredBannerService>
>({})

// Schema for creating new entries
export const sponsoredDataSchema = Type.Pick(
  sponsoredBannerSchema,
  [
    'title',
    'sponsoredId',
    'startDate',
    'endDate',
    'properties',
    'isActive',
    'device',
    'createdAt',
    'updatedAt',
    'type',
    'translations'
  ],
  {
    $id: 'SponsoredBannersData'
  }
)
export type SponsoredBannerData = Static<typeof sponsoredDataSchema>
export const sponsoredBannerDataValidator = getValidator(sponsoredDataSchema, dataValidator)
export const sponsoredBannerDataResolver: any = resolve<SponsoredBanner, HookContext<SponsoredBannerService>>(
  {}
)

// Schema for updating existing entries
export const sponsoredPatchSchema = Type.Partial(sponsoredBannerSchema, {
  $id: 'SponsoredBannersPatch'
})
export type SponsoredBannerPatch = Static<typeof sponsoredPatchSchema>
export const sponsoredBannerPatchValidator = getValidator(sponsoredPatchSchema, dataValidator)
export const sponsoredBannerPatchResolver: any = resolve<
  SponsoredBanner,
  HookContext<SponsoredBannerService>
>({})

// Schema for allowed query properties
export const sponsoredQueryProperties = Type.Pick(sponsoredBannerSchema, ['_id'])
export const sponsoredQuerySchema = Type.Intersect(
  [
    querySyntax(sponsoredQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type SponsoredBannerQuery = Static<typeof sponsoredQuerySchema>
export const sponsoredBannerQueryValidator = getValidator(sponsoredQuerySchema, queryValidator)
export const sponsoredBannerQueryResolver = resolve<
  SponsoredBannerQuery,
  HookContext<SponsoredBannerService>
>({})

export const SponsoredDb = Type.Pick(
  sponsoredBannerSchema,
  [
    'title',
    'sponsoredId',
    'startDate',
    'endDate',
    'isActive',
    'properties',
    'device',
    'createdAt',
    'updatedAt',
    'type',
    'translations'
  ],
  {
    $id: 'SponsoredBannersDb'
  }
)

const mongooseSchema = typeboxToMongooseSchema(SponsoredDb)
export const SponsoredBannerModel = makeMongooseModel('sponsored-banners', mongooseSchema)
