// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { StoreActivityService } from './store-activity.class'

export const CONSTANTS = {
  ORDER_CANCELLED: 'Canceled',
  ORDER_CANCELLED_BY_SHOP: 'Canceled by Shop',
  ORDER_TRANSFERRED: 'Order Transferred to Another Shop'
}

// Main data model schema
export const storeActivitySchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    text: Type.Optional(Type.String())
  },
  { $id: 'StoreActivity', additionalProperties: true }
)
export type StoreActivity = Static<typeof storeActivitySchema>
export const storeActivityValidator = getValidator(storeActivitySchema, dataValidator)
export const storeActivityResolver = resolve<StoreActivity, HookContext<StoreActivityService>>({})

export const storeActivityExternalResolver = resolve<StoreActivity, HookContext<StoreActivityService>>({})

// Schema for creating new entries
export const storeActivityDataSchema = Type.Pick(storeActivitySchema, ['text'], {
  $id: 'StoreActivityData'
})
export type StoreActivityData = Static<typeof storeActivityDataSchema>
export const storeActivityDataValidator = getValidator(storeActivityDataSchema, dataValidator)
export const storeActivityDataResolver = resolve<StoreActivity, HookContext<StoreActivityService>>({})

// Schema for updating existing entries
export const storeActivityPatchSchema = Type.Partial(storeActivitySchema, {
  $id: 'StoreActivityPatch'
})
export type StoreActivityPatch = Static<typeof storeActivityPatchSchema>
export const storeActivityPatchValidator = getValidator(storeActivityPatchSchema, dataValidator)
export const storeActivityPatchResolver = resolve<StoreActivity, HookContext<StoreActivityService>>({})

// Schema for allowed query properties
export const storeActivityQueryProperties = Type.Pick(storeActivitySchema, ['_id', 'text'])
export const storeActivityQuerySchema = Type.Intersect(
  [
    querySyntax(storeActivityQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: true })
  ],
  { additionalProperties: true }
)
export type StoreActivityQuery = Static<typeof storeActivityQuerySchema>
export const storeActivityQueryValidator = getValidator(storeActivityQuerySchema, queryValidator)
export const storeActivityQueryResolver = resolve<StoreActivityQuery, HookContext<StoreActivityService>>({})
