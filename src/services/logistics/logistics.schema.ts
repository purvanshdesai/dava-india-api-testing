// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { Type, getValidator, querySyntax, StringEnum, ObjectIdSchema } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { LogisticsService } from './logistics.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const logisticsSchema = Type.Object(
  {
    ruleName: Type.Optional(Type.String()),
    couriers: Type.Optional(
      Type.Array(
        Type.Object({
          deliveryMode: Type.Optional(StringEnum(['standard', 'oneDay'])),
          partner: StringEnum(['shiprocket', 'swiggy', 'shiprocketQuick', 'delhivery']),
          partnerCourierName: Type.Optional(Type.String()),
          partnerCourierId: Type.String(),
          packageSize: Type.Optional(Type.Array(StringEnum(['small', 'big'])))
        })
      )
    ),
    deliveryZones: Type.Optional(Type.Array(ModelObjectId({ mongoose: { ref: 'delivery-policies' } }))),
    skip: Type.Optional(Type.Number()),
    limit: Type.Optional(Type.Number()),
    search: Type.Optional(Type.String()),
    packageSize: Type.Optional(StringEnum(['small', 'big'])),
    onlyLocal: Type.Optional(Type.Boolean()),
    qcCheck: Type.Optional(Type.Boolean()),
    sourcePostalCode: Type.Optional(Type.String()),
    destinationPostalCode: Type.Optional(Type.String()),
    partner: Type.Optional(Type.String()),
    deliveryPolicyId: Type.Optional(Type.Array(ObjectIdSchema())),
    partnerCourierName: Type.Optional(Type.String()),
    partnerCourierId: Type.Optional(Type.String()),
    searchMode: Type.Optional(Type.String()),
    deliveryMode: Type.Optional(Type.String()),
    logisticPartner: Type.Optional(Type.String())
  },
  { $id: 'Logistics', additionalProperties: false }
)
export type Logistics = Static<typeof logisticsSchema>
export const logisticsValidator = getValidator(logisticsSchema, dataValidator)
export const logisticsResolver = resolve<Logistics, HookContext<LogisticsService>>({})

export const logisticsExternalResolver = resolve<Logistics, HookContext<LogisticsService>>({})

// Schema for creating new entries
export const logisticsDataSchema = Type.Pick(
  logisticsSchema,
  [
    'ruleName',
    'couriers',
    'deliveryZones',
    'deliveryPolicyId',
    'partner',
    'partnerCourierName',
    'partnerCourierId',
    'packageSize'
  ],
  {
    $id: 'LogisticsData'
  }
)
export type LogisticsData = Static<typeof logisticsDataSchema>
export const logisticsDataValidator = getValidator(logisticsDataSchema, dataValidator)
export const logisticsDataResolver = resolve<Logistics, HookContext<LogisticsService>>({})

// Schema for updating existing entries
export const logisticsPatchSchema = Type.Partial(logisticsSchema, {
  $id: 'LogisticsPatch'
})
export type LogisticsPatch = Static<typeof logisticsPatchSchema>
export const logisticsPatchValidator = getValidator(logisticsPatchSchema, dataValidator)
export const logisticsPatchResolver = resolve<Logistics, HookContext<LogisticsService>>({})

// Schema for allowed query properties
export const logisticsQueryProperties = Type.Pick(logisticsSchema, [
  'skip',
  'limit',
  'search',
  'onlyLocal',
  'qcCheck',
  'sourcePostalCode',
  'destinationPostalCode',
  'partner',
  'searchMode',
  'packageSize',
  'deliveryMode',
  'logisticPartner'
])
export const logisticsQuerySchema = Type.Intersect(
  [
    querySyntax(logisticsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type LogisticsQuery = Static<typeof logisticsQuerySchema>
export const logisticsQueryValidator = getValidator(logisticsQuerySchema, queryValidator)
export const logisticsQueryResolver = resolve<LogisticsQuery, HookContext<LogisticsService>>({})

export const logisticsRulesDb = Type.Pick(logisticsSchema, ['ruleName', 'couriers', 'deliveryZones'])
const mongooseSchema = typeboxToMongooseSchema(logisticsRulesDb)
export const LogisticsRulesModel = makeMongooseModel('logistics-rules', mongooseSchema)
