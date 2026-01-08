// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { TaxesService } from './taxes.class'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const taxesSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    name: Type.String(),
    category: Type.String(),
    groups: Type.Optional(Type.Array(Type.String())),
    type: Type.String(),
    rateType: Type.String(),
    rate: Type.Optional(Type.String()),
    taxNote: Type.Optional(Type.String()),
    components: Type.Optional(Type.Array(Type.Any()))
  },
  { $id: 'Taxes', additionalProperties: true }
)
export type Taxes = Static<typeof taxesSchema>
export const taxesValidator = getValidator(taxesSchema, dataValidator)
export const taxesResolver = resolve<Taxes, HookContext<TaxesService>>({})

export const taxesExternalResolver = resolve<Taxes, HookContext<TaxesService>>({})

// Schema for creating new entries
export const taxesDataSchema = Type.Pick(
  taxesSchema,
  ['name', 'category', 'groups', 'type', 'rateType', 'rate', 'taxNote', 'components'],
  {
    $id: 'TaxesData'
  }
)
export type TaxesData = Static<typeof taxesDataSchema>
export const taxesDataValidator = getValidator(taxesDataSchema, dataValidator)
export const taxesDataResolver = resolve<Taxes, HookContext<TaxesService>>({})

// Schema for updating existing entries
export const taxesPatchSchema = Type.Partial(taxesSchema, {
  $id: 'TaxesPatch'
})
export type TaxesPatch = Static<typeof taxesPatchSchema>
export const taxesPatchValidator = getValidator(taxesPatchSchema, dataValidator)
export const taxesPatchResolver = resolve<Taxes, HookContext<TaxesService>>({})

// Schema for allowed query properties
export const taxesQueryProperties = Type.Pick(taxesSchema, [
  '_id',
  'name',
  'category',
  'groups',
  'type',
  'rateType',
  'rate',
  'taxNote'
])
export const taxesQuerySchema = Type.Intersect(
  [
    querySyntax(taxesQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: true })
  ],
  { additionalProperties: true }
)
export type TaxesQuery = Static<typeof taxesQuerySchema>
export const taxesQueryValidator = getValidator(taxesQuerySchema, queryValidator)
export const taxesQueryResolver = resolve<TaxesQuery, HookContext<TaxesService>>({})

export const taxesDbSchema = Type.Pick(taxesSchema, [
  'name',
  'category',
  'groups',
  'type',
  'rateType',
  'rate',
  'taxNote',
  'components'
])
const mongooseSchema = typeboxToMongooseSchema(taxesDbSchema)
export const TaxesModel = makeMongooseModel('taxes', mongooseSchema)
