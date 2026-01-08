// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { NavigationsService } from './navigations.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

export const CONSTANTS = {
  LEVELS: {
    ONE: 1,
    TWO: 2,
    THREE: 3
  }
}

const NumericEnum = (values: number[]) => Type.Union(values.map((value) => Type.Literal(value)))
// Main data model schema
export const navigationsSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    level: NumericEnum([CONSTANTS.LEVELS.ONE, CONSTANTS.LEVELS.TWO, CONSTANTS.LEVELS.THREE]),
    collection: ModelObjectId({ mongoose: { ref: 'collections' } }),
    parentMenu: Type.Optional(Type.Union([ModelObjectId({ mongoose: { ref: 'navigations' } }), Type.Null()])),
    associatedCollections: Type.Optional(Type.Array(ModelObjectId({ mongoose: { ref: 'navigations' } }))),
    position: Type.Optional(Type.Number({ default: 1 }))
  },
  { $id: 'Navigations', additionalProperties: false }
)
export type Navigations = Static<typeof navigationsSchema>
export const navigationsValidator = getValidator(navigationsSchema, dataValidator)
export const navigationsResolver = resolve<Navigations, HookContext<NavigationsService>>({})

export const navigationsExternalResolver = resolve<Navigations, HookContext<NavigationsService>>({})

// Schema for creating new entries
export const navigationsDataSchema = Type.Pick(
  navigationsSchema,
  ['level', 'collection', 'parentMenu', 'associatedCollections', 'position'],
  {
    $id: 'NavigationsData'
  }
)
export type NavigationsData = Static<typeof navigationsDataSchema>
export const navigationsDataValidator = getValidator(navigationsDataSchema, dataValidator)
export const navigationsDataResolver = resolve<Navigations, HookContext<NavigationsService>>({})

// Schema for updating position
export const navigationsPositioningSchema = Type.Pick(navigationsSchema, ['_id', 'position'], {
  $id: 'NavigationsPositioningData'
})
export type NavigationPositioningData = Static<typeof navigationsPositioningSchema>
export const navigationPositioningDataValidator = getValidator(navigationsPositioningSchema, dataValidator)
export const navigationsPositioningDataResolver = resolve<Navigations, HookContext<NavigationsService>>({})

// Schema for updating existing entries
export const navigationsPatchSchema = Type.Partial(navigationsSchema, {
  $id: 'NavigationsPatch'
})
export type NavigationsPatch = Static<typeof navigationsPatchSchema>
export const navigationsPatchValidator = getValidator(navigationsPatchSchema, dataValidator)
export const navigationsPatchResolver = resolve<Navigations, HookContext<NavigationsService>>({})

// Schema for allowed query properties
export const navigationsQueryProperties = Type.Pick(navigationsSchema, [
  '_id',
  'level',
  'collection',
  'parentMenu',
  'associatedCollections',
  'position'
])
export const navigationsQuerySchema = Type.Intersect(
  [
    querySyntax(navigationsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type NavigationsQuery = Static<typeof navigationsQuerySchema>
export const navigationsQueryValidator = getValidator(navigationsQuerySchema, queryValidator)
export const navigationsQueryResolver = resolve<NavigationsQuery, HookContext<NavigationsService>>({})

export const NavigationsDb = Type.Pick(
  navigationsSchema,
  ['level', 'collection', 'parentMenu', 'associatedCollections', 'position'],
  {
    $id: 'NavigationsDb'
  }
)

const mongooseSchema = typeboxToMongooseSchema(NavigationsDb)
export const NavigationsModel = makeMongooseModel('navigations', mongooseSchema)
