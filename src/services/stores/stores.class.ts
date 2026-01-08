// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Paginated, PaginationOptions, Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions, AdapterId } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import { StoreModel, type Stores, type StoresData, type StoresPatch, type StoresQuery } from './stores.schema'
import { StoreAdminUserModal } from '../store-admin-users/store-admin-users.schema'
import { StorePharmacistModel } from '../store-pharmacist/store-pharmacist.schema'
import { randomBytes } from 'crypto'
import { sendEmail } from '../../utils/sendEmail'
import invite from '../../utils/templates/invite'
import moment from 'moment'
import { excludeFieldsInObject } from '../../utils'
import { DeliveryPoliciesModel } from '../delivery-policies/delivery-policies.schema'
import { feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'
import storeAdminInvitation from '../../templates/storeAdminInvitation'
import { BadRequest } from '@feathersjs/errors'
import Logistics, { SUPPORTED_LOGISTICS } from '../../utils/logistics/Logistics'

const app = feathers().configure(configuration())

export type { Stores, StoresData, StoresPatch, StoresQuery }

export interface StoresParams extends MongoDBAdapterParams<StoresQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class StoresService<ServiceParams extends Params = StoresParams> extends MongoDBService<
  Stores,
  StoresData,
  StoresParams,
  StoresPatch
> {
  async createStoreId() {
    const timestamp = moment().format('MMYY')
    const prevTotal = await StoreModel.countDocuments({})

    return timestamp + prevTotal
  }
  async create(data: any, params?: unknown): Promise<any> {
    try {
      const storeEmailExists = await StoreModel.exists({
        email: data.email,
        deleted: {
          $ne: true
        }
      })
      if (storeEmailExists) throw new BadRequest('Email already exists')
      const store = await StoreModel.create({
        ...data,
        active: true,
        storeId: await this.createStoreId(),
        serviceableZip: data.serviceableZip.map((item: any) => Number(item)),
        acceptedInvitation: false,
        pickupLocation: {}
      })
      // await DeliveryPoliciesModel.updateMany(
      //   {
      //     postalCodes: {
      //       $in: store.get('serviceableZip').map((item) => String(item))
      //     }
      //   },
      //   {
      //     $push: {
      //       stores: store.id
      //     }
      //   }
      // )
      let randomData = randomBytes(15).toString('hex')
      const storeUser = await StoreAdminUserModal.create({
        email: store.get('email'),
        passwordResetToken: randomData,
        passwordResetTokenExpiry: moment().add(7, 'days'),
        storeIds: [store.id]
      })

      const storeUserObj = storeUser.toObject()
      const storeObj = store.toObject()
      // TODO address should be added only if in production
      // add store address in pickup locations

      // for (const l of SUPPORTED_LOGISTICS) {
      //   const resp = await Logistics.getAggregator(l).addStorePickupLocation({
      //     locationName: storeObj._id.toString(),
      //     name: storeObj.storeName,
      //     email: storeUserObj.email,
      //     phone: storeObj.phoneNumber || '',
      //     address: storeObj.address || '',
      //     city: storeObj.city,
      //     state: storeObj.state,
      //     pinCode: storeObj.pincode,
      //     country: 'India'
      //   })
      //   if (resp?.pickupLocationId) {
      //     await StoreModel.findByIdAndUpdate(storeObj._id, { logistics: { shiprocket: { pickupLocation: resp.pickupLocationId } }})
      //   }
      // }

      sendEmail({
        to: store.get('email'),
        subject: 'Store invitation',
        message: storeAdminInvitation({
          url: `${app.get('web')}/store-reset-password?token=${randomData}`
        }),
        attachments: []
      })

      return store.toJSON()
    } catch (error) {
      throw error
    }
  }

  async find(params?: StoresParams | any): Promise<any> {
    try {
      const query = params?.query
      const baseQuery = excludeFieldsInObject(['$limit', '$skip', '$sort', 'storeUserStatus'], query)
      baseQuery.deleted = {
        $ne: true
      }

      let storeUserFilter = {}

      if (query?.storeUserStatus && query?.storeUserStatus.length && query?.storeUserStatus.length !== 2) {
        storeUserFilter =
          query?.storeUserStatus[0] === 'true'
            ? {
                'storeUser.password': { $exists: true }
              }
            : {
                $or: [{ 'storeUser.password': { $exists: false } }, { 'storeUser.password': null }]
              }
      }

      const storesAgg = await StoreModel.aggregate([
        { $match: baseQuery },
        {
          $lookup: {
            from: StoreAdminUserModal.collection.name,
            localField: '_id',
            foreignField: 'storeIds',
            as: 'storeUser'
          }
        },
        { $unwind: { path: '$storeUser', preserveNullAndEmptyArrays: true } },
        {
          $match: { ...storeUserFilter }
        },
        {
          $sort: { _id: -1 }
        },
        {
          $facet: {
            data: [{ $skip: query?.$skip || 0 }, { $limit: query?.$limit || 0 }], // Adjust skip and limit as needed
            totalCount: [{ $count: 'count' }]
          }
        }
      ])

      const count = storesAgg[0].totalCount[0] ? storesAgg[0].totalCount[0].count : 0
      const data = storesAgg[0].data

      return {
        data,
        total: count
      }
    } catch (error) {
      throw error
    }
  }

  async get(id: AdapterId, params?: any): Promise<any> {
    try {
      const store = await StoreModel.findById(id).lean()
      return store
    } catch (error) {
      throw error
    }
  }
}

export class FetchStoresPost {
  async create(data: any, params: any) {
    const { zipCodes, type, range, skip = 0, limit = 10 } = data
    const filter: any = {
      acceptedInvitation: true
    }
    if (type === 'range') {
      filter['serviceableZip'] = {
        $gte: range.from,
        $lte: range.to
      }
    } else if (type === 'zipCodes') {
      filter['serviceableZip'] = { $in: zipCodes }
    } else throw new BadRequest('Invalid type provided')
    const total = await StoreModel.countDocuments(filter)
    const result = await StoreModel.find(filter)
      .sort({ _id: -1 })
      .populate('storeUser')
      .skip(skip)
      .limit(limit)
      .lean()
    return {
      total,
      data: result,
      skip,
      limit
    }
  }
}

const EMAIL_REGEX = /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/i
const PHONE_REGEX = /^\d{10}$/
const PINCODE_REGEX = /^\d{6}$/
const PHARMACIST_PIN_REGEX = /^\d{4}$/

type StoreUploadRow = {
  sourceRow?: number
  storeCode?: string
  storeName?: string
  gstNumber?: string
  licenceNumber?: string
  fssaiNumber?: string
  email?: string
  phoneNumber?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  country?: string
  latitude?: number | null
  longitude?: number | null
}

type ServiceableZipRow = {
  sourceRow?: number
  storeCode?: string
  pincode?: string
}

type PharmacistUploadRow = {
  sourceRow?: number
  storeCode?: string
  name?: string
  employeeId?: string
  phoneNumber?: string
  pin?: string
  archive?: boolean
}

interface BulkUploadResult {
  total: number
  processed: number
  successful: number
  created: number
  updated: number
  skipped: number
  failed: number
  duplicates: number
  errors: string[]
}

export class BulkUploadStoresService {
  async create(data: any, params: any): Promise<BulkUploadResult> {
    const appContext: Application | undefined = params?.app

    if (!appContext) {
      throw new BadRequest('Application context is required')
    }

    const stores: StoreUploadRow[] = Array.isArray(data?.stores) ? data.stores : []
    const serviceableZip: ServiceableZipRow[] = Array.isArray(data?.serviceableZip) ? data.serviceableZip : []
    const pharmacists: PharmacistUploadRow[] = Array.isArray(data?.pharmacists) ? data.pharmacists : []

    if (!stores.length && !serviceableZip.length && !pharmacists.length) {
      throw new BadRequest('No store records found in the upload payload')
    }

    const results: BulkUploadResult = {
      total: 0,
      processed: 0,
      successful: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      duplicates: 0,
      errors: []
    }

    const emitProgress = () => {
      if (params?.socket) {
        params.socket.emit('store_bulk_upload_progress', {
          type: 'store_bulk_upload_progress',
          data: { ...results }
        })
      }
    }

    const normalize = (value: string | number | null | undefined) =>
      typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value).trim() : ''

    const serviceableMap = new Map<string, { pincodes: Set<number>; rows: number[] }>()

    for (const entry of serviceableZip) {
      const storeCode = normalize(entry?.storeCode)
      const pincode = normalize(entry?.pincode)
      const rowRef = entry?.sourceRow ? `row ${entry.sourceRow}` : 'row ?'

      if (!storeCode || !pincode) {
        results.errors.push(`Serviceable Zip sheet ${rowRef}: store code and pincode are required`)
        continue
      }

      if (!PINCODE_REGEX.test(pincode)) {
        results.errors.push(`Serviceable Zip sheet ${rowRef} (${storeCode}): invalid pincode ${pincode}`)
        continue
      }

      const key = storeCode.toLowerCase()
      const record = serviceableMap.get(key) ?? { pincodes: new Set<number>(), rows: [] }
      record.pincodes.add(Number(pincode))
      if (entry?.sourceRow) {
        record.rows.push(entry.sourceRow)
      }
      serviceableMap.set(key, record)
    }

    const pharmacistPinSet = new Set<string>()
    const pharmacistMap = new Map<string, PharmacistUploadRow[]>()

    for (const entry of pharmacists) {
      const storeCode = normalize(entry?.storeCode)
      const name = normalize(entry?.name)
      const employeeId = normalize(entry?.employeeId)
      const phoneNumber = normalize(entry?.phoneNumber)
      const pin = normalize(entry?.pin)
      const rowRef = entry?.sourceRow ? `row ${entry.sourceRow}` : 'row ?'

      if (!storeCode || !name || !employeeId || !phoneNumber || !pin) {
        results.errors.push(
          `Pharmacist sheet ${rowRef}${storeCode ? ` (${storeCode})` : ''}: missing required fields`
        )
        continue
      }

      if (!PHONE_REGEX.test(phoneNumber)) {
        results.errors.push(`Pharmacist sheet ${rowRef} (${storeCode}): phone number must be 10 digits`)
        continue
      }

      if (!PHARMACIST_PIN_REGEX.test(pin)) {
        results.errors.push(`Pharmacist sheet ${rowRef} (${storeCode}): pin must be 4 digits`)
        continue
      }

      if (pharmacistPinSet.has(pin)) {
        results.errors.push(`Pharmacist sheet ${rowRef} (${storeCode}): duplicate pin ${pin} in upload`)
        continue
      }

      pharmacistPinSet.add(pin)
      const key = storeCode.toLowerCase()
      const storePharmacists = pharmacistMap.get(key) ?? []
      storePharmacists.push({
        sourceRow: entry?.sourceRow,
        storeCode,
        name,
        employeeId,
        phoneNumber,
        pin,
        archive: false
      })
      pharmacistMap.set(key, storePharmacists)
    }

    const storeCodes = stores
      .map((store) => normalize(store?.storeCode))
      .filter((code): code is string => Boolean(code))
    const normalizedStoreCodes = storeCodes.map((code) => code.toLowerCase())
    const storeEmails = stores
      .map((store) => normalize(store?.email).toLowerCase())
      .filter((email) => Boolean(email))

    const aggregatedStoreCodes = new Set<string>([
      ...normalizedStoreCodes,
      ...serviceableMap.keys(),
      ...pharmacistMap.keys()
    ])

    if (!aggregatedStoreCodes.size) {
      throw new BadRequest('No store codes found in the upload payload')
    }

    results.total = aggregatedStoreCodes.size

    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    const storeCodeQueries = Array.from(aggregatedStoreCodes).map((code) => ({
      storeCode: { $regex: new RegExp(`^${escapeRegExp(code)}$`, 'i') }
    }))
    const emailQueries = storeEmails.length > 0 ? [{ email: { $in: storeEmails } }] : []
    const queryConditions = [...storeCodeQueries, ...emailQueries]

    const existingStores = await StoreModel.find({
      deleted: { $ne: true },
      $or: queryConditions
    })
      .select(
        '_id storeCode email serviceableZip storeName gstNumber licenceNumber fssaiNumber phoneNumber address city state pincode country coordinates'
      )
      .lean()

    const existingStoreMap = new Map<string, any>()
    const existingEmailMap = new Map<string, string>()
    existingStores.forEach((store) => {
      const code = (store.storeCode || '').toLowerCase()
      if (code) {
        existingStoreMap.set(code, store)
      }

      const emailKey = (store.email || '').toLowerCase()
      if (emailKey) {
        existingEmailMap.set(emailKey, store._id.toString())
      }
    })

    const internalStoreCodes = new Set<string>()
    const internalEmails = new Set<string>()
    const processedStoreCodes = new Set<string>()

    const storeService = appContext.service('stores')

    const upsertPharmacistsForStore = async (storeId: any, normalizedCode: string) => {
      const pharmacistsForStore = pharmacistMap.get(normalizedCode) ?? []
      if (!pharmacistsForStore.length) return

      for (const pharmacist of pharmacistsForStore) {
        // Match by employeeId and store for better update accuracy
        const existingPharmacist = await StorePharmacistModel.findOne({
          store: storeId,
          employeeId: pharmacist.employeeId
        }).lean()

        if (existingPharmacist) {
          // Update existing pharmacist
          await StorePharmacistModel.findByIdAndUpdate(existingPharmacist._id, {
            name: pharmacist.name,
            employeeId: pharmacist.employeeId,
            phoneNumber: pharmacist.phoneNumber,
            pin: pharmacist.pin,
            archive: pharmacist.archive || false
          })
        } else {
          // Create new pharmacist
          await StorePharmacistModel.create({
            name: pharmacist.name,
            employeeId: pharmacist.employeeId,
            phoneNumber: pharmacist.phoneNumber,
            pin: pharmacist.pin,
            store: storeId,
            archive: pharmacist.archive || false
          })
        }
      }
    }

    for (const store of stores) {
      const storeCode = normalize(store?.storeCode)
      const rowRef = store?.sourceRow ? `row ${store.sourceRow}` : 'row ?'

      if (!storeCode) {
        results.failed += 1
        results.errors.push(`Stores sheet ${rowRef}: store code is required`)
        emitProgress()
        continue
      }

      const normalizedCode = storeCode.toLowerCase()

      if (internalStoreCodes.has(normalizedCode)) {
        results.duplicates += 1
        results.skipped += 1
        results.errors.push(`Stores sheet ${rowRef} (${storeCode}): duplicate store code in upload`)
        emitProgress()
        continue
      }

      internalStoreCodes.add(normalizedCode)
      results.processed += 1

      const storeName = normalize(store?.storeName)
      const gstNumber = normalize(store?.gstNumber)
      const licenceNumber = normalize(store?.licenceNumber)
      const fssaiNumber = normalize(store?.fssaiNumber)
      const emailRaw = normalize(store?.email)
      const email = emailRaw.toLowerCase()
      const phoneNumber = normalize(store?.phoneNumber)
      const address = normalize(store?.address)
      const city = normalize(store?.city)
      const state = normalize(store?.state)
      const pincode = normalize(store?.pincode)
      const country = normalize(store?.country) || 'India'
      const latitude = store?.latitude
      const longitude = store?.longitude
      const normalizedEmail = email

      if (normalizedEmail && internalEmails.has(normalizedEmail)) {
        results.duplicates += 1
        results.skipped += 1
        results.errors.push(`Stores sheet ${rowRef} (${storeCode}): duplicate email ${emailRaw} in upload`)
        emitProgress()
        continue
      }

      const validationErrors: string[] = []

      if (!storeName) validationErrors.push('store name is required')
      if (!gstNumber) validationErrors.push('gst number is required')
      if (!licenceNumber) validationErrors.push('licence number is required')
      if (!email) validationErrors.push('email is required')
      if (email && !EMAIL_REGEX.test(email)) validationErrors.push('invalid email format')
      if (!phoneNumber) validationErrors.push('phone number is required')
      if (phoneNumber && !PHONE_REGEX.test(phoneNumber)) {
        validationErrors.push('phone number must be 10 digits')
      }
      if (!address) validationErrors.push('address is required')
      if (!city) validationErrors.push('city is required')
      if (!state) validationErrors.push('state is required')
      if (!pincode) validationErrors.push('pincode is required')
      if (pincode && !PINCODE_REGEX.test(pincode)) {
        validationErrors.push('pincode must be 6 digits')
      }

      if (latitude !== null && latitude !== undefined) {
        if (!Number.isFinite(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90) {
          validationErrors.push('latitude must be between -90 and 90')
        }
      }

      if (longitude !== null && longitude !== undefined) {
        if (!Number.isFinite(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180) {
          validationErrors.push('longitude must be between -180 and 180')
        }
      }

      const serviceableEntry = serviceableMap.get(normalizedCode)
      const storeServiceableZip = serviceableEntry?.pincodes ?? new Set<number>()

      // Note: serviceableZip validation removed to allow stores without serviceable zip codes
      // This enables pharmacist-only uploads

      if (validationErrors.length > 0) {
        results.failed += 1
        results.errors.push(`Stores sheet ${rowRef} (${storeCode}): ${validationErrors.join(', ')}`)
        emitProgress()
        continue
      }

      const basePayload: any = {
        storeName,
        gstNumber,
        licenceNumber,
        fssaiNumber: fssaiNumber || undefined,
        email,
        phoneNumber,
        address,
        city,
        state,
        pincode,
        country: country || 'India'
      }

      if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
        basePayload.coordinates = {
          longitude: Number(longitude),
          latitude: Number(latitude)
        }
      }

      const existingStore = existingStoreMap.get(normalizedCode)

      if (existingStore) {
        const existingEmail = (existingStore.email || '').toLowerCase()

        if (
          normalizedEmail &&
          normalizedEmail !== existingEmail &&
          existingEmailMap.has(normalizedEmail) &&
          existingEmailMap.get(normalizedEmail) !== existingStore._id.toString()
        ) {
          results.failed += 1
          results.errors.push(
            `Stores sheet ${rowRef} (${storeCode}): email ${emailRaw} already exists for another store`
          )
          emitProgress()
          continue
        }

        if (normalizedEmail) {
          internalEmails.add(normalizedEmail)
        }

        const existingZipSet = new Set<number>(
          Array.isArray(existingStore.serviceableZip)
            ? existingStore.serviceableZip.map((zip: any) => Number(zip))
            : []
        )

        for (const zip of storeServiceableZip) {
          existingZipSet.add(Number(zip))
        }

        const patchPayload: any = {
          ...basePayload,
          serviceableZip: Array.from(existingZipSet)
        }

        try {
          const updatedStore = await storeService.patch(existingStore._id, patchPayload, {
            user: params?.user
          })

          await upsertPharmacistsForStore(existingStore._id, normalizedCode)

          existingStoreMap.set(normalizedCode, {
            ...existingStore,
            ...updatedStore,
            serviceableZip: patchPayload.serviceableZip,
            email: normalizedEmail || existingStore.email
          })

          if (existingEmail && normalizedEmail && existingEmail !== normalizedEmail) {
            existingEmailMap.delete(existingEmail)
          }

          if (normalizedEmail) {
            existingEmailMap.set(normalizedEmail, existingStore._id.toString())
          }

          results.updated += 1
          results.successful = results.created + results.updated
          processedStoreCodes.add(normalizedCode)
        } catch (error: any) {
          results.failed += 1
          results.errors.push(
            `Stores sheet ${rowRef} (${storeCode}): ${error?.message || 'failed to update store'}`
          )
        }

        emitProgress()
        continue
      }

      if (normalizedEmail && existingEmailMap.has(normalizedEmail)) {
        results.duplicates += 1
        results.skipped += 1
        results.errors.push(`Stores sheet ${rowRef} (${storeCode}): email ${emailRaw} already exists`)
        emitProgress()
        continue
      }

      if (normalizedEmail) {
        internalEmails.add(normalizedEmail)
      }

      const createPayload: any = {
        storeCode,
        ...basePayload,
        serviceableZip:
          storeServiceableZip.size > 0 ? Array.from(storeServiceableZip).map((zip) => Number(zip)) : []
      }

      let createdStore: any = null

      try {
        createdStore = await storeService.create(createPayload, { user: params?.user })

        const createdStoreObj = createdStore?.toObject?.() ?? createdStore?.toJSON?.() ?? createdStore
        const createdStoreId = createdStoreObj?._id ?? createdStoreObj?.id

        if (createdStoreId) {
          existingStoreMap.set(normalizedCode, {
            ...createdStoreObj,
            _id: createdStoreId,
            storeCode: createdStoreObj?.storeCode ?? storeCode,
            email: createdStoreObj?.email ?? email,
            serviceableZip: createdStoreObj?.serviceableZip ?? createPayload.serviceableZip
          })

          if (normalizedEmail) {
            existingEmailMap.set(normalizedEmail, createdStoreId.toString())
          }
        }

        if (createdStoreId) {
          await upsertPharmacistsForStore(createdStoreId, normalizedCode)
        }

        results.created += 1
        results.successful = results.created + results.updated
        processedStoreCodes.add(normalizedCode)
      } catch (error: any) {
        results.failed += 1
        results.errors.push(
          `Stores sheet ${rowRef} (${storeCode}): ${error?.message || 'failed to create store'}`
        )

        if (createdStore?._id) {
          await StoreModel.findByIdAndDelete(createdStore._id)
          await StoreAdminUserModal.deleteMany({ storeIds: createdStore._id })
          await StorePharmacistModel.deleteMany({ store: createdStore._id })
        }
      }

      emitProgress()
    }

    const serviceableOnlyCodes = Array.from(serviceableMap.keys()).filter(
      (code) => !processedStoreCodes.has(code)
    )

    for (const code of serviceableOnlyCodes) {
      results.processed += 1

      const serviceableEntry = serviceableMap.get(code)
      const rowLabel =
        serviceableEntry?.rows && serviceableEntry.rows.length
          ? `rows ${serviceableEntry.rows.join(', ')}`
          : 'rows ?'

      const existingStore = existingStoreMap.get(code)

      if (!existingStore) {
        results.skipped += 1
        results.errors.push(`Serviceable Zip sheet ${rowLabel} (${code}): store not found, skipping update`)
        emitProgress()
        continue
      }

      const existingZipSet = new Set<number>(
        Array.isArray(existingStore.serviceableZip)
          ? existingStore.serviceableZip.map((zip: any) => Number(zip))
          : []
      )

      for (const zip of serviceableEntry?.pincodes ?? []) {
        existingZipSet.add(Number(zip))
      }

      try {
        await storeService.patch(
          existingStore._id,
          { serviceableZip: Array.from(existingZipSet) },
          { user: params?.user }
        )

        await upsertPharmacistsForStore(existingStore._id, code)

        existingStore.serviceableZip = Array.from(existingZipSet)
        results.updated += 1
        results.successful = results.created + results.updated
        processedStoreCodes.add(code)
      } catch (error: any) {
        results.failed += 1
        results.errors.push(
          `Serviceable Zip sheet ${rowLabel} (${code}): ${error?.message || 'failed to update store'}`
        )
      }

      emitProgress()
    }

    const pharmacistOnlyCodes = Array.from(pharmacistMap.keys()).filter(
      (code) => !processedStoreCodes.has(code) && !serviceableMap.has(code)
    )

    for (const code of pharmacistOnlyCodes) {
      results.processed += 1

      const pharmacistRows = pharmacistMap.get(code) ?? []
      const rowNumbers = pharmacistRows
        .map((row) => row.sourceRow)
        .filter((value): value is number => typeof value === 'number')
      const rowLabel = rowNumbers.length ? `rows ${rowNumbers.join(', ')}` : 'rows ?'

      const existingStore = existingStoreMap.get(code)

      if (!existingStore) {
        results.skipped += 1
        results.errors.push(`Pharmacist sheet ${rowLabel} (${code}): store not found, skipping update`)
        emitProgress()
        continue
      }

      try {
        await upsertPharmacistsForStore(existingStore._id, code)
        results.updated += 1
        results.successful = results.created + results.updated
        processedStoreCodes.add(code)
      } catch (error: any) {
        results.failed += 1
        results.errors.push(
          `Pharmacist sheet ${rowLabel} (${code}): ${error?.message || 'failed to update pharmacists'}`
        )
      }

      emitProgress()
    }

    results.successful = results.created + results.updated

    if (params?.socket) {
      params.socket.emit('store_bulk_upload_complete', {
        type: 'store_bulk_upload_complete',
        data: { ...results }
      })
    }

    return results
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('stores'))
  }
}
