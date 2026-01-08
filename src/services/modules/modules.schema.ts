// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import { ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { ModulesService } from './modules.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

const CONSTANTS = {
  GROUP: { STORE_ADMIN: 'storeAdmin', ADMIN: 'admin', DISTRIBUTORS: 'distributors' }
}
// Main data model schema
export const modulesSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    moduleName: Type.String(),
    sectionName: Type.Optional(Type.String()),
    key: Type.String(),
    description: Type.Optional(Type.String()),
    permissions: Type.Array(ModelObjectId({ mongoose: { ref: 'permissions' } })),
    group: StringEnum([CONSTANTS.GROUP.STORE_ADMIN, CONSTANTS.GROUP.ADMIN, CONSTANTS.GROUP.DISTRIBUTORS]),
    createdAt: Type.Optional(Type.String({ format: 'date-time' })),
    updatedAt: Type.Optional(Type.String({ format: 'date-time' }))
  },
  { $id: 'Modules', additionalProperties: false }
)
export type Modules = Static<typeof modulesSchema>
export const modulesValidator = getValidator(modulesSchema, dataValidator)
export const modulesResolver = resolve<Modules, HookContext<ModulesService>>({})

export const modulesExternalResolver = resolve<Modules, HookContext<ModulesService>>({})

// Schema for creating new entries
export const modulesDataSchema = Type.Pick(
  modulesSchema,
  ['moduleName', 'key', 'description', 'permissions', 'group', 'createdAt', 'updatedAt', 'sectionName'],
  {
    $id: 'ModulesData'
  }
)
export type ModulesData = Static<typeof modulesDataSchema>
export const modulesDataValidator = getValidator(modulesDataSchema, dataValidator)
export const modulesDataResolver = resolve<Modules, HookContext<ModulesService>>({})

// Schema for updating existing entries
export const modulesPatchSchema = Type.Partial(modulesSchema, {
  $id: 'ModulesPatch'
})
export type ModulesPatch = Static<typeof modulesPatchSchema>
export const modulesPatchValidator = getValidator(modulesPatchSchema, dataValidator)
export const modulesPatchResolver = resolve<Modules, HookContext<ModulesService>>({})

// Schema for allowed query properties
export const modulesQueryProperties = Type.Pick(modulesSchema, [
  '_id',
  'moduleName',
  'sectionName',
  'key',
  'description',
  'permissions',
  'group',
  'createdAt',
  'updatedAt'
])
export const modulesQuerySchema = Type.Intersect(
  [
    querySyntax(modulesQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type ModulesQuery = Static<typeof modulesQuerySchema>
export const modulesQueryValidator = getValidator(modulesQuerySchema, queryValidator)
export const modulesQueryResolver = resolve<ModulesQuery, HookContext<ModulesService>>({})

export const ModulesDb = Type.Pick(
  modulesSchema,
  ['moduleName', 'sectionName', 'key', 'description', 'permissions', 'group', 'createdAt', 'updatedAt'],
  {
    $id: 'ModulesDb'
  }
)

const mongooseSchema = typeboxToMongooseSchema(ModulesDb)
export const ModulesModel = makeMongooseModel('modules', mongooseSchema)
