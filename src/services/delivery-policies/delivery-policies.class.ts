// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions, AdapterId } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import {
  DeliveryPoliciesModel,
  type DeliveryPolicies,
  type DeliveryPoliciesData,
  type DeliveryPoliciesPatch,
  type DeliveryPoliciesQuery
} from './delivery-policies.schema'
import { StoreModel } from '../stores/stores.schema'
import { ZipCodesModel } from '../zip-codes/zip-codes.schema'
import { BadRequest } from '@feathersjs/errors'
import { Types } from 'mongoose'

export type { DeliveryPolicies, DeliveryPoliciesData, DeliveryPoliciesPatch, DeliveryPoliciesQuery }

export interface DeliveryPoliciesParams extends MongoDBAdapterParams<DeliveryPoliciesQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class DeliveryPoliciesService<
  ServiceParams extends Params = DeliveryPoliciesParams
> extends MongoDBService<
  DeliveryPolicies,
  DeliveryPoliciesData,
  DeliveryPoliciesParams,
  DeliveryPoliciesPatch
> {
  async get(id: AdapterId, params?: DeliveryPoliciesParams | undefined): Promise<any> {
    try {
      const deliveryPolicy = await DeliveryPoliciesModel.findById(id).populate('stores').lean()

      return deliveryPolicy
    } catch (error) {
      throw error
    }
  }
  // ---- PRIVATE UTILITIES -----

  /**
   * Normalize postal codes into string[]
   */
  private normalizePostalCodes(list: any[]): string[] {
    if (!Array.isArray(list)) return []
    return list.map((x) => String(x).trim())
  }

  /**
   * Detect if any of the postal codes already have a delivery policy.
   * If ignoreId is provided, that ID is excluded (for PATCH).
   */
  private async getPolicyConflicts(postalCodes: string[], ignoreId?: string) {
    if (!postalCodes.length) return null

    // Normalize postal codes to handle both string and number types in database
    const normalizedCodes = postalCodes.map((code) => String(code).trim())
    const numericCodes = normalizedCodes.map((code) => Number(code)).filter((num) => !isNaN(num))

    // Create a Set of normalized codes for fast lookup
    const normalizedSet = new Set(normalizedCodes)

    // Build query - check for both string and number types
    // MongoDB $in is type-sensitive, so we need $or to check both types
    const baseQuery: any = {
      $or: [{ postalCodes: { $in: normalizedCodes } }, { postalCodes: { $in: numericCodes } }]
    }

    if (ignoreId) {
      baseQuery._id = { $ne: ignoreId }
    }

    // Fetch all overlapping policies
    const policies = await DeliveryPoliciesModel.find(baseQuery).select('_id zoneName postalCodes').lean()

    if (!policies.length) return null

    // Build detailed conflict info
    const detailedConflicts = policies
      .map((policy: any) => {
        // Normalize policy postal codes to strings for comparison
        const policyCodes = policy.postalCodes?.map((p: any) => String(p).trim()) || []
        // Use Set for faster lookup when dealing with large arrays
        const overlappingCodes = policyCodes.filter((p: string) => normalizedSet.has(p))

        return {
          policyId: policy._id,
          zoneName: policy.zoneName,
          overlappingPostalCodes: overlappingCodes
        }
      })
      .filter((conflict) => conflict.overlappingPostalCodes.length > 0) // Only include conflicts with actual overlaps

    if (!detailedConflicts.length) return null

    // Collect all overlapping codes into one flat list
    const allOverlappingCodes = detailedConflicts.map((c) => c.overlappingPostalCodes).flat()

    return {
      conflicts: detailedConflicts, // <-- zone-wise detail
      overlapping: allOverlappingCodes
    }
  }

  /**
   * Find all stores that serve the given postal codes.
   */
  private async getStoresByPostalCodes(postalCodes: string[]) {
    return StoreModel.find({
      serviceableZip: { $in: postalCodes.map(Number) },
      acceptedInvitation: true
    }).lean()
  }

  /**
   * Extract postal codes from a numeric range using ZipCodes collection.
   */
  private async getPostalCodesFromRange(from: number, to: number) {
    const zipCodes = await ZipCodesModel.find({
      zipCode: { $gte: from, $lte: to }
    }).distinct('zipCode')

    return this.normalizePostalCodes(zipCodes)
  }

  async create(data: any, params?: any): Promise<any> {
    try {
      let postalCodes: string[] = []
      let stores: any[] = []

      // --- CASE 1: Direct postal codes ---
      if (data?.postalCodeType === 'postalCode') {
        delete data.postalCodeRanges

        postalCodes = this.normalizePostalCodes(data.postalCodes)

        // Check duplicates
        const conflict: any = await this.getPolicyConflicts(postalCodes)
        if (conflict) {
          const zoneNames = conflict.conflicts.map((c: any) => c.zoneName).join(', ')
          const conflictingCodes = [...new Set(conflict.overlapping)]
          const codesDisplay =
            conflictingCodes.length <= 10
              ? conflictingCodes.join(', ')
              : `${conflictingCodes.slice(0, 10).join(', ')} and ${conflictingCodes.length - 10} more`

          throw new BadRequest(
            `Postal code conflict detected. Conflicting postal codes: ${codesDisplay}. ` +
              `These postal codes already exist in zone(s): ${zoneNames}`
          )
        }
        stores = await this.getStoresByPostalCodes(postalCodes)
      }

      // --- CASE 2: Range selection ---
      else {
        delete data.postalCodes

        const from = Number(data.postalCodeRanges?.from)
        const to = Number(data.postalCodeRanges?.to)

        // Get zip codes from DB
        const zipCodes = await ZipCodesModel.find({
          zipCode: { $gte: from, $lte: to }
        }).distinct('zipCode')

        postalCodes = this.normalizePostalCodes(zipCodes)

        // Check duplicates
        const conflict: any = await this.getPolicyConflicts(postalCodes)
        if (conflict) {
          const zoneNames = conflict.conflicts.map((c: any) => c.zoneName).join(', ')
          const conflictingCodes = [...new Set(conflict.overlapping)]
          const codesDisplay =
            conflictingCodes.length <= 10
              ? conflictingCodes.join(', ')
              : `${conflictingCodes.slice(0, 10).join(', ')} and ${conflictingCodes.length - 10} more`

          throw new BadRequest(
            `Postal code conflict detected. Conflicting postal codes: ${codesDisplay}. ` +
              `These postal codes already exist in zone(s): ${zoneNames}`
          )
        }

        data.postalCodes = postalCodes

        stores = await this.getStoresByPostalCodes(postalCodes)
      }

      // Create new policy
      const deliveryPolicy = await DeliveryPoliciesModel.create({
        ...data,
        postalCodes,
        stores: stores.map((s) => s._id),
        active: true
      })

      // Mark as deliverable
      await ZipCodesModel.updateMany({ zipCode: { $in: postalCodes } }, { isDeliverable: true })

      return deliveryPolicy
    } catch (error) {
      throw error
    }
  }

  async patch(id: any, data: any): Promise<any> {
    try {
      const existing = await DeliveryPoliciesModel.findById(id).lean()
      if (!existing) throw new BadRequest('Policy not found')

      const beforePostal = this.normalizePostalCodes(existing.postalCodes || [])

      let postalCodes: string[] = []
      let stores: any[] = []

      const postalCodeType = data?.postalCodeType || existing.postalCodeType

      // --- CASE 1: Direct postal codes ---
      if (postalCodeType === 'postalCode') {
        delete data.postalCodeRanges

        postalCodes = this.normalizePostalCodes(data.postalCodes)

        const conflict: any = await this.getPolicyConflicts(postalCodes, id)
        if (conflict) {
          const zoneNames = conflict.conflicts.map((c: any) => c.zoneName).join(', ')
          const conflictingCodes = [...new Set(conflict.overlapping)]
          const codesDisplay =
            conflictingCodes.length <= 10
              ? conflictingCodes.join(', ')
              : `${conflictingCodes.slice(0, 10).join(', ')} and ${conflictingCodes.length - 10} more`

          throw new BadRequest(
            `Postal code conflict detected. Conflicting postal codes: ${codesDisplay}. ` +
              `These postal codes already exist in zone(s): ${zoneNames}`
          )
        }
        stores = await this.getStoresByPostalCodes(postalCodes)
      }

      // --- CASE 2: Ranges ---
      else {
        delete data.postalCodes

        const from = Number(data?.postalCodeRanges?.from)
        const to = Number(data?.postalCodeRanges?.to)

        const zipCodes = await ZipCodesModel.find({
          zipCode: { $gte: from, $lte: to }
        }).distinct('zipCode')

        postalCodes = this.normalizePostalCodes(zipCodes)

        const conflict: any = await this.getPolicyConflicts(postalCodes, id)
        if (conflict) {
          const zoneNames = conflict.conflicts.map((c: any) => c.zoneName).join(', ')
          const conflictingCodes = [...new Set(conflict.overlapping)]
          const codesDisplay =
            conflictingCodes.length <= 10
              ? conflictingCodes.join(', ')
              : `${conflictingCodes.slice(0, 10).join(', ')} and ${conflictingCodes.length - 10} more`

          throw new BadRequest(
            `Postal code conflict detected. Conflicting postal codes: ${codesDisplay}. ` +
              `These postal codes already exist in zone(s): ${zoneNames}`
          )
        }

        data.postalCodes = postalCodes

        stores = await this.getStoresByPostalCodes(postalCodes)
      }

      // Update policy
      const updated = await DeliveryPoliciesModel.findByIdAndUpdate(
        id,
        {
          ...data,
          postalCodes,
          stores: stores.map((s) => s._id)
        },
        { new: true }
      )

      const afterPostal = this.normalizePostalCodes(updated?.postalCodes || ([] as any))

      const added = afterPostal.filter((p) => !beforePostal.includes(p))
      const removed = beforePostal.filter((p) => !afterPostal.includes(p))

      // Update deliverable flags
      await ZipCodesModel.updateMany({ zipCode: { $in: added } }, { isDeliverable: true })
      await ZipCodesModel.updateMany({ zipCode: { $in: removed } }, { isDeliverable: false })

      return updated
    } catch (error) {
      throw error
    }
  }
}

export class DeliveryModeTemplatesService<
  ServiceParams extends Params = DeliveryPoliciesParams
> extends MongoDBService<
  DeliveryPolicies,
  DeliveryPoliciesData,
  DeliveryPoliciesParams,
  DeliveryPoliciesPatch
> {
  async find(params?: DeliveryPoliciesParams | undefined): Promise<any> {
    try {
      const deliveryModeTemplates = await DeliveryPoliciesModel.find()
        .select('zoneName deliveryModes isOneDayDeliveryAvailable isStandardDeliveryAvailable')
        .lean()

      return deliveryModeTemplates
    } catch (error) {
      throw error
    }
  }
}

const PINCODE_REGEX = /^\d{6}$/

const normalizePincode = (input: string | number | null | undefined): string | null => {
  if (input === null || input === undefined) return null

  const value = typeof input === 'number' ? input.toString() : String(input ?? '').trim()
  if (!value) return null

  const digitsOnly = value.replace(/[^0-9]/g, '')
  if (PINCODE_REGEX.test(digitsOnly)) {
    return digitsOnly
  }

  return null
}

interface SkippedPincode {
  pincode: string | number
  reason: string
  rowRef?: string
  zoneName?: string
}

const normalizePincodeWithReason = (
  input: string | number | null | undefined,
  rowRef?: string,
  zoneName?: string
): { normalized: string | null; skipped?: SkippedPincode } => {
  if (input === null || input === undefined) {
    return {
      normalized: null,
      skipped: {
        pincode: input ?? '',
        reason: 'Pincode is null or undefined',
        rowRef,
        zoneName
      }
    }
  }

  const value = typeof input === 'number' ? input.toString() : String(input ?? '').trim()
  if (!value) {
    return {
      normalized: null,
      skipped: {
        pincode: input,
        reason: 'Pincode is empty',
        rowRef,
        zoneName
      }
    }
  }

  const digitsOnly = value.replace(/[^0-9]/g, '')
  if (!PINCODE_REGEX.test(digitsOnly)) {
    let reason = 'Invalid pincode format'
    if (digitsOnly.length === 0) {
      reason = 'Pincode contains no digits'
    } else if (digitsOnly.length < 6) {
      reason = `Pincode has only ${digitsOnly.length} digits (requires 6 digits)`
    } else if (digitsOnly.length > 6) {
      reason = `Pincode has ${digitsOnly.length} digits (requires exactly 6 digits)`
    }

    return {
      normalized: null,
      skipped: {
        pincode: input,
        reason,
        rowRef,
        zoneName
      }
    }
  }

  return { normalized: digitsOnly }
}

const getDefaultDeliveryModes = () => ({
  standard: {
    timeDurationType: 'days',
    deliveryTime: 0,
    priceRange: [
      {
        priceFrom: 0,
        priceTo: 0,
        noLimit: false,
        deliveryCharge: 0
      }
    ]
  },
  oneDay: {
    timeDurationType: 'days',
    deliveryTime: 0,
    priceRange: [
      {
        priceFrom: 0,
        priceTo: 0,
        noLimit: false,
        deliveryCharge: 0
      }
    ]
  }
})

interface BulkUploadPolicyRow {
  zoneName?: string
  postalCodes?: Array<string | number>
  storeCodes?: Array<string>
  rows?: number[]
  description?: string
  isStandardDeliveryAvailable?: boolean
  isOneDayDeliveryAvailable?: boolean
  deliveryModes?: {
    standard?: any
    oneDay?: any
  }
}

interface DeliveryPolicyBulkUploadResult {
  total: number
  processed: number
  successful: number
  created: number
  updated: number
  skipped: number
  conflicts: number
  failed: number
  errors: string[]
  skippedPincodes: SkippedPincode[]
}

export class BulkUploadDeliveryPoliciesService {
  async create(payload: any, params: any): Promise<DeliveryPolicyBulkUploadResult> {
    const appContext: Application | undefined = params?.app

    if (!appContext) {
      throw new BadRequest('Application context is required')
    }

    const policies: BulkUploadPolicyRow[] = Array.isArray(payload?.policies) ? payload.policies : []

    if (!policies.length) {
      throw new BadRequest('No delivery policy records found in upload payload')
    }

    const results: DeliveryPolicyBulkUploadResult = {
      total: policies.length,
      processed: 0,
      successful: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      conflicts: 0,
      failed: 0,
      errors: [],
      skippedPincodes: []
    }

    const emitProgress = () => {
      if (params?.socket) {
        params.socket.emit('delivery_policy_bulk_upload_progress', {
          type: 'delivery_policy_bulk_upload_progress',
          data: { ...results }
        })
      }
    }

    const deliveryPolicyService = appContext.service('delivery-policies') as any

    for (const policy of policies) {
      results.processed += 1

      const zoneName = typeof policy?.zoneName === 'string' ? policy.zoneName.trim() : ''
      const rowRef =
        Array.isArray(policy?.rows) && policy.rows.length
          ? `rows ${policy.rows.join(', ')}`
          : `record ${results.processed}`

      if (!zoneName) {
        results.failed += 1
        results.errors.push(`Delivery policy ${rowRef}: zone name is required`)
        emitProgress()
        continue
      }

      const postalCodesInput = Array.isArray(policy?.postalCodes) ? policy.postalCodes : []
      const normalizedPostalCodes = new Set<string>()

      for (const code of postalCodesInput) {
        const { normalized, skipped } = normalizePincodeWithReason(code, rowRef, zoneName)
        if (normalized) {
          normalizedPostalCodes.add(normalized)
        } else if (skipped) {
          results.skippedPincodes.push(skipped)
          results.skipped += 1
        }
      }

      if (!normalizedPostalCodes.size) {
        results.failed += 1
        results.errors.push(`no valid pincodes provided`)
        emitProgress()
        continue
      }

      // Check which pincodes exist in ZipCodes collection
      const normalizedPostalCodesArray = Array.from(normalizedPostalCodes)
      const existingZipCodes = await ZipCodesModel.find({
        zipCode: { $in: normalizedPostalCodesArray.map(Number) }
      })
        .select('zipCode')
        .lean()

      const existingZipCodeSet = new Set(existingZipCodes.map((zc) => String(zc.zipCode)))

      // Track pincodes that don't exist in ZipCodes collection
      const validPostalCodes: string[] = []
      for (const code of normalizedPostalCodesArray) {
        if (existingZipCodeSet.has(code)) {
          validPostalCodes.push(code)
        } else {
          results.skippedPincodes.push({
            pincode: code,
            reason: 'Pincode not found in zip codes database',
            rowRef,
            zoneName
          })
          results.skipped += 1
        }
      }

      if (!validPostalCodes.length) {
        results.failed += 1
        results.errors.push(`no valid pincodes found in zip codes database`)
        emitProgress()
        continue
      }

      const postalCodes = validPostalCodes

      const storeCodesInput = Array.isArray(policy?.storeCodes) ? policy.storeCodes : []
      const normalizedStoreCodes = Array.from(
        new Set(
          storeCodesInput
            .map((code) => (typeof code === 'string' ? code.trim().toUpperCase() : ''))
            .filter((code) => Boolean(code))
        )
      )

      const additionalStores = normalizedStoreCodes.length
        ? await StoreModel.find({
            storeCode: { $in: normalizedStoreCodes },
            acceptedInvitation: true,
            deleted: { $ne: true }
          })
            .select('_id storeCode')
            .lean()
        : []

      const foundStoreCodes = new Set(
        additionalStores
          .map((store) => (store.storeCode || '').toString().trim().toUpperCase())
          .filter((code) => Boolean(code))
      )

      const missingStoreCodes = normalizedStoreCodes.filter((code) => !foundStoreCodes.has(code))

      if (missingStoreCodes.length) {
        results.errors.push(`Store codes not found - ${missingStoreCodes.join(', ')}`)
      }

      const additionalStoreIds = additionalStores.map((store) => store._id)

      try {
        const existingPolicy = await DeliveryPoliciesModel.findOne({
          zoneName: { $regex: new RegExp(`^${zoneName}$`, 'i') }
        }).lean()

        if (existingPolicy) {
          const existingPostalCodes = Array.isArray(existingPolicy.postalCodes)
            ? existingPolicy.postalCodes
                .map((code: any) => normalizePincode(code))
                .filter((code): code is string => Boolean(code))
            : []

          const mergedPostalCodes = Array.from(new Set<string>([...existingPostalCodes, ...postalCodes]))

          await deliveryPolicyService.patch(
            existingPolicy._id,
            {
              postalCodeType: 'postalCode',
              postalCodes: mergedPostalCodes
            },
            { user: params?.user, additionalStoreIds }
          )

          results.updated += 1
          results.successful += 1
        } else {
          const description =
            typeof policy?.description === 'string' && policy.description.trim()
              ? policy.description.trim()
              : `Auto generated policy for ${zoneName}`

          const defaultModes = getDefaultDeliveryModes()

          const deliveryModes = {
            standard: policy?.deliveryModes?.standard || defaultModes.standard,
            oneDay: policy?.deliveryModes?.oneDay || defaultModes.oneDay
          }

          await deliveryPolicyService.create(
            {
              zoneName,
              description,
              postalCodeType: 'postalCode',
              postalCodes,
              isStandardDeliveryAvailable: Boolean(policy?.isStandardDeliveryAvailable),
              isOneDayDeliveryAvailable: Boolean(policy?.isOneDayDeliveryAvailable),
              deliveryModes
            },
            { user: params?.user, additionalStoreIds }
          )

          results.created += 1
          results.successful += 1
        }
      } catch (error: any) {
        const message = error?.message || 'Failed to process delivery policy'

        results.failed += 1
        if (/Policy already exists for selected zip code/i.test(message)) {
          results.conflicts += 1
        }

        results.errors.push(`${message}`)
        emitProgress()
        continue
      }

      emitProgress()
    }

    if (params?.socket) {
      params.socket.emit('delivery_policy_bulk_upload_complete', {
        type: 'delivery_policy_bulk_upload_complete',
        data: { ...results }
      })
    }

    return results
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('delivery-policies'))
  }
}
