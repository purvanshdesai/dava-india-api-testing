// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { ApplicationTaxService } from './application-tax.class'

// Main data model schema
export const applicationTaxSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    defaultTax: Type.Object({
      taxId: Type.String(),
      date: Type.String()
    }),
    createdBy: Type.String(),
    updatedBy: Type.Optional(Type.String())
  },
  { $id: 'ApplicationTax', additionalProperties: false }
)
export type ApplicationTax = Static<typeof applicationTaxSchema>
export const applicationTaxValidator = getValidator(applicationTaxSchema, dataValidator)
export const applicationTaxResolver = resolve<ApplicationTax, HookContext<ApplicationTaxService>>({})

export const applicationTaxExternalResolver = resolve<ApplicationTax, HookContext<ApplicationTaxService>>({})

// Schema for creating new entries
export const applicationTaxDataSchema = Type.Pick(
  applicationTaxSchema,
  ['defaultTax', 'createdBy', 'updatedBy'],
  {
    $id: 'ApplicationTaxData'
  }
)
export type ApplicationTaxData = Static<typeof applicationTaxDataSchema>
export const applicationTaxDataValidator = getValidator(applicationTaxDataSchema, dataValidator)
export const applicationTaxDataResolver = resolve<ApplicationTax, HookContext<ApplicationTaxService>>({})

// Schema for updating existing entries
export const applicationTaxPatchSchema = Type.Partial(applicationTaxSchema, {
  $id: 'ApplicationTaxPatch'
})
export type ApplicationTaxPatch = Static<typeof applicationTaxPatchSchema>
export const applicationTaxPatchValidator = getValidator(applicationTaxPatchSchema, dataValidator)
export const applicationTaxPatchResolver = resolve<ApplicationTax, HookContext<ApplicationTaxService>>({})

// Schema for allowed query properties
export const applicationTaxQueryProperties = Type.Pick(applicationTaxSchema, [
  '_id',
  'defaultTax',
  'createdBy',
  'updatedBy'
])
export const applicationTaxQuerySchema = Type.Intersect(
  [
    querySyntax(applicationTaxQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type ApplicationTaxQuery = Static<typeof applicationTaxQuerySchema>
export const applicationTaxQueryValidator = getValidator(applicationTaxQuerySchema, queryValidator)
export const applicationTaxQueryResolver = resolve<ApplicationTaxQuery, HookContext<ApplicationTaxService>>(
  {}
)
