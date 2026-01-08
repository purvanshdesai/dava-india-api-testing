// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { PoliciesService } from './policies.class'

// Main data model schema
export const policiesSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    name: Type.Optional(Type.String()),
    content: Type.Optional(Type.Any())
  },
  { $id: 'Policies', additionalProperties: false }
)
export type Policies = Static<typeof policiesSchema>
export const policiesValidator = getValidator(policiesSchema, dataValidator)
export const policiesResolver = resolve<Policies, HookContext<PoliciesService>>({})

export const policiesExternalResolver = resolve<Policies, HookContext<PoliciesService>>({})

// Schema for creating new entries
export const policiesDataSchema = Type.Pick(policiesSchema, ['name','content'], {
  $id: 'PoliciesData'
})
export type PoliciesData = Static<typeof policiesDataSchema>
export const policiesDataValidator = getValidator(policiesDataSchema, dataValidator)
export const policiesDataResolver = resolve<Policies, HookContext<PoliciesService>>({})

// Schema for updating existing entries
export const policiesPatchSchema = Type.Partial(policiesSchema, {
  $id: 'PoliciesPatch'
})
export type PoliciesPatch = Static<typeof policiesPatchSchema>
export const policiesPatchValidator = getValidator(policiesPatchSchema, dataValidator)
export const policiesPatchResolver = resolve<Policies, HookContext<PoliciesService>>({})

// Schema for allowed query properties
export const policiesQueryProperties = Type.Pick(policiesSchema, ['_id', 'name','content'])
export const policiesQuerySchema = Type.Intersect(
  [
    querySyntax(policiesQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type PoliciesQuery = Static<typeof policiesQuerySchema>
export const policiesQueryValidator = getValidator(policiesQuerySchema, queryValidator)
export const policiesQueryResolver = resolve<PoliciesQuery, HookContext<PoliciesService>>({})
