// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax, StringEnum } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { StoreInventoryService } from './store-inventory.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'
import { CONSTANTS } from '../inventory-stock/inventory-stock.schema'

// Main data model schema
export const storeInventorySchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    storeId: ModelObjectId({
      mongoose: {
        ref: 'stores'
      }
    }),
    productId: ModelObjectId({
      mongoose: {
        ref: 'products'
      }
    }),
    stock: Type.Number(),
    quantity: Type.Number(),
    softHoldCount: Type.Optional(Type.Number()),
    softHoldForOrderCount: Type.Optional(Type.Number()),
    operation: StringEnum([CONSTANTS.ADD_STOCK, CONSTANTS.REMOVE_STOCK]),
    reason: Type.String(),
    paginate: Type.Optional(Type.Boolean()),
    skip: Type.Optional(Type.Number()),
    limit: Type.Optional(Type.Number()),
    productName: Type.Optional(Type.String()),
    createdBy: ModelObjectId({
      mongoose: {
        ref: 'store-admin-users'
      }
    }),
    batches: Type.Array(Type.Any()),
    batchNo: Type.String(),
    expiryDate: Type.String(),
    filters: Type.Optional(Type.Any())
  },
  { $id: 'StoreInventory', additionalProperties: false }
)
export type StoreInventory = Static<typeof storeInventorySchema>
export const storeInventoryValidator = getValidator(storeInventorySchema, dataValidator)
export const storeInventoryResolver = resolve<StoreInventory, HookContext<StoreInventoryService>>({})

export const storeInventoryExternalResolver = resolve<StoreInventory, HookContext<StoreInventoryService>>({})

// Schema for creating new entries
export const storeInventoryDataSchema = Type.Pick(
  storeInventorySchema,
  ['storeId', 'productId', 'stock', 'batchNo', 'expiryDate', 'filters'],
  {
    $id: 'StoreInventoryData'
  }
)
export type StoreInventoryData = Static<typeof storeInventoryDataSchema>
export const storeInventoryDataValidator = getValidator(storeInventoryDataSchema, dataValidator)
export const storeInventoryDataResolver = resolve<StoreInventory, HookContext<StoreInventoryService>>({})

// Schema for updating existing entries
export const storeInventoryPatchSchema = Type.Partial(storeInventorySchema, {
  $id: 'StoreInventoryPatch'
})
export type StoreInventoryPatch = Static<typeof storeInventoryPatchSchema>
export const storeInventoryPatchValidator = getValidator(storeInventoryPatchSchema, dataValidator)
export const storeInventoryPatchResolver = resolve<StoreInventory, HookContext<StoreInventoryService>>({})

// Schema for allowed query properties
export const storeInventoryQueryProperties = Type.Pick(storeInventorySchema, [
  'storeId',
  'productId',
  'paginate',
  'skip',
  'limit',
  'productName',
  'filters'
])
export const storeInventoryQuerySchema = Type.Intersect(
  [
    querySyntax(storeInventoryQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type StoreInventoryQuery = Static<typeof storeInventoryQuerySchema>
export const storeInventoryQueryValidator = getValidator(storeInventoryQuerySchema, queryValidator)
export const storeInventoryQueryResolver = resolve<StoreInventoryQuery, HookContext<StoreInventoryService>>(
  {}
)

export const storeInventoryDb = Type.Omit(
  storeInventorySchema,
  ['_id', 'operation', 'quantity', 'reason', 'productName', 'filters'],
  {
    $id: 'storeInventoryDb'
  }
)

const mongooseSchema = typeboxToMongooseSchema(storeInventoryDb)

export const StoreInventoryModel = makeMongooseModel('store-inventory', mongooseSchema)
