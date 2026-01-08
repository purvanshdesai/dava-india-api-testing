// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { PermissionsService } from './permissions.class'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const permissionsSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    permissionName: Type.String(),
    description: Type.Optional(Type.String()),
    key: Type.String()
  },
  { $id: 'Permissions', additionalProperties: false }
)
export type Permissions = Static<typeof permissionsSchema>
export const permissionsValidator = getValidator(permissionsSchema, dataValidator)
export const permissionsResolver = resolve<Permissions, HookContext<PermissionsService>>({})

export const permissionsExternalResolver = resolve<Permissions, HookContext<PermissionsService>>({})

// Schema for creating new entries
export const permissionsDataSchema = Type.Pick(permissionsSchema, ['permissionName', 'description', 'key'], {
  $id: 'PermissionsData'
})
export type PermissionsData = Static<typeof permissionsDataSchema>
export const permissionsDataValidator = getValidator(permissionsDataSchema, dataValidator)
export const permissionsDataResolver = resolve<Permissions, HookContext<PermissionsService>>({})

// Schema for updating existing entries
export const permissionsPatchSchema = Type.Partial(permissionsSchema, {
  $id: 'PermissionsPatch'
})
export type PermissionsPatch = Static<typeof permissionsPatchSchema>
export const permissionsPatchValidator = getValidator(permissionsPatchSchema, dataValidator)
export const permissionsPatchResolver = resolve<Permissions, HookContext<PermissionsService>>({})

// Schema for allowed query properties
export const permissionsQueryProperties = Type.Pick(permissionsSchema, [
  '_id',
  'permissionName',
  'description',
  'key'
])
export const permissionsQuerySchema = Type.Intersect(
  [
    querySyntax(permissionsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type PermissionsQuery = Static<typeof permissionsQuerySchema>
export const permissionsQueryValidator = getValidator(permissionsQuerySchema, queryValidator)
export const permissionsQueryResolver = resolve<PermissionsQuery, HookContext<PermissionsService>>({})

export const PermissionsDb = Type.Pick(permissionsSchema, ['permissionName', 'description', 'key'], {
  $id: 'PermissionsDb'
})

// export type TCouponsDb = Static<typeof couponsDataSchema>

const mongooseSchema = typeboxToMongooseSchema(PermissionsDb)
export const PermissionsModel = makeMongooseModel('permissions', mongooseSchema)
