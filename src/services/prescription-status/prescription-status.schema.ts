// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { PrescriptionStatusService } from './prescription-status.class'

// Main data model schema
export const prescriptionStatusSchema = Type.Object(
  {
    ticketId: Type.String(),
    status: StringEnum(['accept', 'reject']),
    items: Type.Array(
      Type.Object({
        productId: Type.String(),
        quantity: Type.Number()
      })
    )
  },
  { $id: 'PrescriptionStatus', additionalProperties: false }
)
export type PrescriptionStatus = Static<typeof prescriptionStatusSchema>
export const prescriptionStatusValidator = getValidator(prescriptionStatusSchema, dataValidator)
export const prescriptionStatusResolver = resolve<PrescriptionStatus, HookContext<PrescriptionStatusService>>(
  {}
)

export const prescriptionStatusExternalResolver = resolve<
  PrescriptionStatus,
  HookContext<PrescriptionStatusService>
>({})

// Schema for creating new entries
export const prescriptionStatusDataSchema = Type.Pick(
  prescriptionStatusSchema,
  ['ticketId', 'status', 'items'],
  {
    $id: 'PrescriptionStatusData'
  }
)
export type PrescriptionStatusData = Static<typeof prescriptionStatusDataSchema>
export const prescriptionStatusDataValidator = getValidator(prescriptionStatusDataSchema, dataValidator)
export const prescriptionStatusDataResolver = resolve<
  PrescriptionStatus,
  HookContext<PrescriptionStatusService>
>({})

// Schema for updating existing entries
export const prescriptionStatusPatchSchema = Type.Partial(prescriptionStatusSchema, {
  $id: 'PrescriptionStatusPatch'
})
export type PrescriptionStatusPatch = Static<typeof prescriptionStatusPatchSchema>
export const prescriptionStatusPatchValidator = getValidator(prescriptionStatusPatchSchema, dataValidator)
export const prescriptionStatusPatchResolver = resolve<
  PrescriptionStatus,
  HookContext<PrescriptionStatusService>
>({})

// Schema for allowed query properties
export const prescriptionStatusQueryProperties = Type.Pick(prescriptionStatusSchema, [])
export const prescriptionStatusQuerySchema = Type.Intersect(
  [
    querySyntax(prescriptionStatusQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type PrescriptionStatusQuery = Static<typeof prescriptionStatusQuerySchema>
export const prescriptionStatusQueryValidator = getValidator(prescriptionStatusQuerySchema, queryValidator)
export const prescriptionStatusQueryResolver = resolve<
  PrescriptionStatusQuery,
  HookContext<PrescriptionStatusService>
>({})
