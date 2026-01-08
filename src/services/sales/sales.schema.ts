// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { SalesService } from './sales.class'

// Main data model schema
export const salesSchema = Type.Object(
  {
    productId: Type.String(),
    orderId: Type.Optional(Type.String())
  },
  { $id: 'Sales', additionalProperties: false }
)
export type Sales = Static<typeof salesSchema>
export const salesValidator = getValidator(salesSchema, dataValidator)
export const salesResolver = resolve<Sales, HookContext<SalesService>>({})

export const salesExternalResolver = resolve<Sales, HookContext<SalesService>>({})

// Schema for creating new entries
export const salesDataSchema = Type.Pick(salesSchema, [], {
  $id: 'SalesData'
})
export type SalesData = Static<typeof salesDataSchema>
export const salesDataValidator = getValidator(salesDataSchema, dataValidator)
export const salesDataResolver = resolve<Sales, HookContext<SalesService>>({})

// Schema for updating existing entries
export const salesPatchSchema = Type.Partial(salesSchema, {
  $id: 'SalesPatch'
})
export type SalesPatch = Static<typeof salesPatchSchema>
export const salesPatchValidator = getValidator(salesPatchSchema, dataValidator)
export const salesPatchResolver = resolve<Sales, HookContext<SalesService>>({})

// Schema for allowed query properties
export const salesQueryProperties = Type.Pick(salesSchema, ['productId', 'orderId'])
export const salesQuerySchema = Type.Intersect(
  [
    querySyntax(salesQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type SalesQuery = Static<typeof salesQuerySchema>
export const salesQueryValidator = getValidator(salesQuerySchema, queryValidator)
export const salesQueryResolver = resolve<SalesQuery, HookContext<SalesService>>({})
