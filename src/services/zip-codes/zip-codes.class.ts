// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Id, Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type { ZipCodes, ZipCodesData, ZipCodesPatch, ZipCodesQuery } from './zip-codes.schema'
import { ZipCodesModel } from './zip-codes.schema'
import { DeliveryPoliciesModel } from '../delivery-policies/delivery-policies.schema'
import { BadRequest } from '@feathersjs/errors'
import { defaultZipCode } from './zip-codes.shared'
import dayjs from 'dayjs'
import { geocodePincode } from '../../utils/geocoding'

export type { ZipCodes, ZipCodesData, ZipCodesPatch, ZipCodesQuery }

export interface ZipCodesParams extends MongoDBAdapterParams<ZipCodesQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class ZipCodesService<ServiceParams extends Params = ZipCodesParams> extends MongoDBService<
  ZipCodes,
  ZipCodesData,
  ZipCodesParams,
  ZipCodesPatch
> {}

export class ConsumerZipCodesService<ServiceParams extends Params = ZipCodesParams> extends MongoDBService<
  ZipCodes,
  ZipCodesData,
  ZipCodesParams,
  ZipCodesPatch
> {
  async find(params?: ZipCodesParams | undefined | any): Promise<any> {
    const { zipCode, lat, lng } = params?.query

    const latitude = Number(lat),
      longitude = Number(lng)
    let location: any = {}

    const fetchDefaultLocation = async () => {
      return await ZipCodesModel.findOne({ zipCode: defaultZipCode }).lean()
    }

    if (zipCode) {
      location = await ZipCodesModel.findOne({ zipCode }).lean()
    } else if (!latitude || !longitude) {
      location = await fetchDefaultLocation()
    } else {
      const locations = await ZipCodesModel.find({
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [longitude, latitude] },
            $minDistance: 100,
            $maxDistance: 10000
          }
        }
      })

      // console.log(locations)
      location = locations?.length ? locations[0] : await fetchDefaultLocation()
    }

    const deliveryPolicy = await DeliveryPoliciesModel.findOne({
      postalCodes: location?.zipCode
    })
      .sort({ expectedDeliveryTime: 'desc' })
      .lean()

    let policy: any = { deliveryEstimation: false }

    const dMode = deliveryPolicy?.deliveryModes['standard']

    if (deliveryPolicy) {
      policy = {
        deliveryEstimation: dayjs().add(dMode?.deliveryTime ?? 0, dMode?.timeDurationType ?? ('days' as any))
      }
    }

    return { location, deliveryPolicy: policy }
  }
}

export class ZipCodeGet {
  async get(id: Id) {
    try {
      const zipCode = await ZipCodesModel.findOne({ zipCode: id }).lean()
      if (!zipCode) throw new BadRequest('Not found')
      return zipCode
    } catch (error) {
      throw error
    }
  }
}

export class FetchZipCodesPost {
  async create(data: any, params: any) {
    const { zipCodes, type, range, skip = 0, limit = 10 } = data
    const filter: any = {}
    if (type === 'range') {
      filter['zipCode'] = {
        $gte: range.from,
        $lte: range.to
      }
    } else if (type === 'zipCodes') {
      filter['zipCode'] = { $in: zipCodes }
    } else throw new BadRequest('Invalid type provided')
    const total = await ZipCodesModel.countDocuments(filter)
    const result = await ZipCodesModel.find(filter).skip(skip).limit(limit).lean()
    return {
      total,
      data: result,
      skip,
      limit
    }
  }
}

export class BulkUploadZipCodesService {
  async create(data: any, params: any) {
    const { data: zipCodeData } = data

    const results = {
      total: zipCodeData.length,
      successful: 0,
      failed: 0,
      duplicates: 0,
      errors: [] as string[]
    }

    // Get existing zipcodes to check for duplicates
    const existingZipCodes = await ZipCodesModel.find({
      zipCode: { $in: zipCodeData.map((item: any) => item.zipcode) }
    })
      .select('zipCode')
      .lean()

    const existingZipCodeSet = new Set(existingZipCodes.map((item) => item.zipCode))

    // Process each zipcode
    for (let i = 0; i < zipCodeData.length; i++) {
      const item = zipCodeData[i]
      const rowNumber = i + 1

      try {
        // Check for duplicates
        if (existingZipCodeSet.has(item.zipcode)) {
          results.duplicates++
          results.errors.push(`Row ${rowNumber} (${item.zipcode}): Duplicate zipcode already exists`)
          continue
        }

        // Validate data with detailed error messages
        const validationErrors = []

        if (!item.zipcode) validationErrors.push('zipcode is required')
        if (!item.area) validationErrors.push('area is required')
        if (!item.district) validationErrors.push('district is required')
        if (!item.state) validationErrors.push('state is required')

        if (validationErrors.length > 0) {
          results.failed++
          results.errors.push(`Row ${rowNumber} (${item.zipcode || 'N/A'}): ${validationErrors.join(', ')}`)
          continue
        }

        // Validate zipcode format (6 digits for Indian pincodes)
        if (!/^\d{6}$/.test(item.zipcode)) {
          results.failed++
          results.errors.push(`Row ${rowNumber} (${item.zipcode}): Invalid zipcode format - must be 6 digits`)
          continue
        }

        // Handle coordinates - either use provided ones or fetch from Google API
        let latitude: number
        let longitude: number

        if (typeof item.latitude === 'number' && typeof item.longitude === 'number') {
          // Validate provided coordinates
          if (item.latitude < -90 || item.latitude > 90) {
            results.failed++
            results.errors.push(
              `Row ${rowNumber} (${item.zipcode}): Invalid latitude - must be between -90 and 90`
            )
            continue
          }

          if (item.longitude < -180 || item.longitude > 180) {
            results.failed++
            results.errors.push(
              `Row ${rowNumber} (${item.zipcode}): Invalid longitude - must be between -180 and 180`
            )
            continue
          }

          latitude = item.latitude
          longitude = item.longitude
        } else {
          // Coordinates not provided, fetch from Google API
          try {
            const geocodeResult = await geocodePincode(
              item.zipcode,
              item.area,
              item.district,
              item.state
            )
            latitude = geocodeResult.latitude
            longitude = geocodeResult.longitude
          } catch (error: any) {
            results.failed++
            results.errors.push(
              `Row ${rowNumber} (${item.zipcode}): Failed to fetch coordinates from Google API - ${error.message}`
            )
            continue
          }
        }

        // Create zipcode entry
        const zipCodeEntry = {
          zipCode: item.zipcode,
          area: item.area,
          district: item.district,
          state: item.state,
          location: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          isDeliverable: true
        }

        await ZipCodesModel.create(zipCodeEntry)
        results.successful++

        // Add to existing set to prevent duplicates within the same batch
        existingZipCodeSet.add(item.zipcode)
      } catch (error: any) {
        results.failed++
        results.errors.push(`Row ${rowNumber} (${item.zipcode || 'N/A'}): ${error.message}`)
      }

      // Emit progress update via socket every 10 records or at the end
      if ((i + 1) % 10 === 0 || i === zipCodeData.length - 1) {
        const progressData = {
          type: 'bulk_upload_progress',
          data: {
            total: results.total,
            processed: i + 1,
            successful: results.successful,
            failed: results.failed,
            duplicates: results.duplicates,
            errors: results.errors,
            percentage: Math.round(((i + 1) / results.total) * 100)
          }
        }

        // Emit directly to socket if available
        if (params.socket) {
          params.socket.emit('bulk_upload_progress', progressData)
        }
      }
    }

    // Emit final result
    const finalResult = {
      type: 'bulk_upload_complete',
      data: results
    }

    // Emit directly to socket if available
    if (params.socket) {
      params.socket.emit('bulk_upload_complete', finalResult)
    }

    return results
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('zip-codes'))
  }
}
