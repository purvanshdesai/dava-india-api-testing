// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax, ObjectIdSchema, StringEnum } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { InventoryStockService } from './inventory-stock.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

export const CONSTANTS = { ADD_STOCK: 'add', REMOVE_STOCK: 'remove' }
// Main data model schema
export const inventoryStockSchema = Type.Object(
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
    updatedStock: Type.Number(),
    quantity: Type.Number(),
    operation: StringEnum([CONSTANTS.ADD_STOCK, CONSTANTS.REMOVE_STOCK]),
    reason: Type.String(),
    createdAt: Type.String({ format: 'date-time' }),
    createdBy: ModelObjectId({
      mongoose: {
        ref: 'store-admin-users'
      }
    }),
    paginate: Type.Optional(Type.Boolean()),
    skip: Type.Optional(Type.Number()),
    limit: Type.Optional(Type.Number()),
    batchNo: Type.String()
  },
  { $id: 'InventoryStock', additionalProperties: false }
)
export type InventoryStock = Static<typeof inventoryStockSchema>
export const inventoryStockValidator = getValidator(inventoryStockSchema, dataValidator)
export const inventoryStockResolver = resolve<InventoryStock, HookContext<InventoryStockService>>({})

export const inventoryStockExternalResolver = resolve<InventoryStock, HookContext<InventoryStockService>>({})

// Schema for creating new entries
export const inventoryStockDataSchema = Type.Pick(
  inventoryStockSchema,
  ['storeId', 'productId', 'quantity', 'operation', 'reason'],
  {
    $id: 'InventoryStockData'
  }
)
export type InventoryStockData = Static<typeof inventoryStockDataSchema>
export const inventoryStockDataValidator = getValidator(inventoryStockDataSchema, dataValidator)
export const inventoryStockDataResolver = resolve<InventoryStock, HookContext<InventoryStockService>>({})

// Schema for updating existing entries
export const inventoryStockPatchSchema = Type.Partial(inventoryStockSchema, {
  $id: 'InventoryStockPatch'
})
export type InventoryStockPatch = Static<typeof inventoryStockPatchSchema>
export const inventoryStockPatchValidator = getValidator(inventoryStockPatchSchema, dataValidator)
export const inventoryStockPatchResolver = resolve<InventoryStock, HookContext<InventoryStockService>>({})

// Schema for allowed query properties
export const inventoryStockQueryProperties = Type.Pick(inventoryStockSchema, [
  'storeId',
  'productId',
  'paginate',
  'skip',
  'limit'
])
export const inventoryStockQuerySchema = Type.Intersect(
  [
    querySyntax(inventoryStockQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type InventoryStockQuery = Static<typeof inventoryStockQuerySchema>
export const inventoryStockQueryValidator = getValidator(inventoryStockQuerySchema, queryValidator)
export const inventoryStockQueryResolver = resolve<InventoryStockQuery, HookContext<InventoryStockService>>(
  {}
)

export const inventoryStockDb = Type.Omit(inventoryStockSchema, ['_id'], {
  $id: 'inventoryStockDb'
})

const mongooseSchema = typeboxToMongooseSchema(inventoryStockDb)

export const InventoryStockModel = makeMongooseModel('inventory-stock', mongooseSchema)
