// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'
import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { RolesService } from './roles.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const rolesSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    roleName: Type.String(),
    description: Type.Optional(Type.String()),
    fullAccess: Type.Boolean({ default: false }),
    modules: Type.Array(
      Type.Object({
        moduleId: ModelObjectId({ mongoose: { ref: 'modules' } }),
        permissions: Type.Array(ModelObjectId({ mongoose: { ref: 'permissions' } }))
      })
    ),
    active: Type.Boolean({ default: true }),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
  },
  { $id: 'Roles', additionalProperties: false }
)
export type Roles = Static<typeof rolesSchema>
export const rolesValidator = getValidator(rolesSchema, dataValidator)
export const rolesResolver = resolve<Roles, HookContext<RolesService>>({})

export const rolesExternalResolver = resolve<Roles, HookContext<RolesService>>({})

// Schema for creating new entries
export const rolesDataSchema = Type.Pick(
  rolesSchema,
  ['roleName', 'description', 'modules', 'fullAccess', 'active', 'createdAt', 'updatedAt'],
  {
    $id: 'RolesData'
  }
)
export type RolesData = Static<typeof rolesDataSchema>
export const rolesDataValidator = getValidator(rolesDataSchema, dataValidator)
export const rolesDataResolver = resolve<Roles, HookContext<RolesService>>({})

// Schema for updating existing entries
export const rolesPatchSchema = Type.Partial(rolesSchema, {
  $id: 'RolesPatch'
})
export type RolesPatch = Static<typeof rolesPatchSchema>
export const rolesPatchValidator = getValidator(rolesPatchSchema, dataValidator)
export const rolesPatchResolver = resolve<Roles, HookContext<RolesService>>({})

// Schema for allowed query properties
export const rolesQueryProperties = Type.Pick(rolesSchema, [
  '_id',
  'roleName',
  'description',
  'modules',
  'fullAccess',
  'active',
  'createdAt',
  'updatedAt'
])
export const rolesQuerySchema = Type.Intersect(
  [
    querySyntax(rolesQueryProperties, {
      roleName: { $regex: Type.String(), $options: Type.String() }
    }),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: true })
  ],
  { additionalProperties: true }
)
export type RolesQuery = Static<typeof rolesQuerySchema>
export const rolesQueryValidator = getValidator(rolesQuerySchema, queryValidator)
export const rolesQueryResolver = resolve<RolesQuery, HookContext<RolesService>>({})

export const RolesDb = Type.Pick(
  rolesSchema,
  ['roleName', 'description', 'modules', 'fullAccess', 'active', 'createdAt', 'updatedAt'],
  {
    $id: 'RolesDb'
  }
)
export type RolesDbType = Static<typeof RolesDb>

const mongooseSchema = typeboxToMongooseSchema(RolesDb)
export const RolesModel = makeMongooseModel('roles', mongooseSchema)
