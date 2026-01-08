// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import {
  Logistics,
  LogisticsData,
  LogisticsPatch,
  LogisticsQuery,
  LogisticsRulesModel
} from './logistics.schema'
import { BadRequest } from '@feathersjs/errors'
import LogisticsAggregator, { AVAILABLE_LOGISTICS } from '../../utils/logistics/Logistics'
import { DeliveryPoliciesModel } from '../delivery-policies/delivery-policies.schema'
import { Types } from 'mongoose'
import { PACKAGE_SPCECS } from '../../constants/general'
import { ZipCodesModel } from '../zip-codes/zip-codes.schema'
import { logger } from '../../logger'
import { Shiprocket } from '../../utils/logistics/Shiprocket'

export type { Logistics, LogisticsData, LogisticsPatch, LogisticsQuery }

export interface LogisticsServiceOptions {
  app: Application
}

export interface LogisticsParams extends Params<LogisticsQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class LogisticsService<ServiceParams extends LogisticsParams = LogisticsParams>
  implements ServiceInterface<Logistics, LogisticsData, ServiceParams, LogisticsPatch>
{
  constructor(public options: LogisticsServiceOptions) {}

  async find(params?: any): Promise<any> {
    const { skip = 0, limit = 10, search } = params.query

    const filter: any = {}
    if (search) filter.ruleName = { $regex: new RegExp(`${search}`, 'i') }

    const data: any = LogisticsRulesModel.find(filter).skip(skip).limit(limit).lean()
    return {
      data,
      skip,
      limit,
      total: await LogisticsRulesModel.countDocuments(filter)
    }
  }

  async get(id: Id, _params?: ServiceParams): Promise<any> {
    return await LogisticsRulesModel.findById(id).lean()
  }

  async create(data: LogisticsData, params?: ServiceParams): Promise<any> {
    const { ruleName, couriers, deliveryZones } = data
    const doc = (await LogisticsRulesModel.create({ ruleName, couriers, deliveryZones })).toObject()
    return doc
  }

  async patch(id: NullableId, data: LogisticsPatch, _params?: ServiceParams): Promise<any> {
    const rule = LogisticsRulesModel.findById(id).lean()
    if (!rule) throw new BadRequest('Rule not found')

    const { ruleName, deliveryZones, couriers } = data

    return LogisticsRulesModel.findByIdAndUpdate(id, { ruleName, deliveryZones, couriers })
  }

  async remove(id: NullableId, _params?: ServiceParams): Promise<any> {
    return LogisticsRulesModel.findByIdAndDelete(id)
  }
}

export class CourierPartnersService<ServiceParams extends LogisticsParams = LogisticsParams>
  implements ServiceInterface<Logistics, LogisticsData, ServiceParams, LogisticsPatch>
{
  constructor(public options: LogisticsServiceOptions) {}

  async find(params?: any): Promise<any[]> {
    try {
      const { logisticPartner } = params.query

      switch (logisticPartner) {
        case AVAILABLE_LOGISTICS.SHIPROCKET:
          return await this.handleShiprocketRequest(params?.query)
        case AVAILABLE_LOGISTICS.SHIPROCKET_QUICK:
          return await this.handleShiprocketQuickRequest(params?.query)
        case AVAILABLE_LOGISTICS.DELHIVERY:
          return await this.handleDelhiveryRequest(params?.query)

        default:
          throw new Error('Logistics Partner not found!')
      }
    } catch (e) {
      logger.error(e)
      throw e
    }
  }

  async handleShiprocketRequest(params: any): Promise<Array<any>> {
    const {
      search,
      onlyLocal = false,
      qcCheck = false,
      partner = 'shiprocket',
      searchMode = 'name',
      sourcePostalCode,
      destinationPostalCode,
      packageSize
    } = params

    let partnerCouriers: any[] = []
    if (
      !searchMode ||
      searchMode === 'name' ||
      (searchMode === 'serviceability' && (!sourcePostalCode || !destinationPostalCode))
    ) {
      partnerCouriers =
        (await (LogisticsAggregator.getAggregator(partner as any) as Shiprocket).listOfCouriers()) ?? []
    } else {
      const zipCodes = await ZipCodesModel.find({
        zipCode: { $in: [sourcePostalCode, destinationPostalCode] }
      }).lean()
      const sourceZipCode = zipCodes.find((z) => z.zipCode === sourcePostalCode)
      const destinationZipCode = zipCodes.find((z) => z.zipCode === destinationPostalCode)
      if (!sourceZipCode) throw new BadRequest('Source zip code not available in system')
      if (!destinationZipCode) throw new BadRequest('Destination zip code not available in system')

      const sourceZipCodeLatlng = sourceZipCode.location.coordinates
      const destinationZipCodeLatlng = destinationZipCode.location.coordinates

      const packageSpecs =
        packageSize === 'big'
          ? {
              height: PACKAGE_SPCECS.BIG.length,
              width: PACKAGE_SPCECS.BIG.width,
              breadth: PACKAGE_SPCECS.BIG.breadth,
              weight: PACKAGE_SPCECS.BIG.weight
            }
          : {
              height: PACKAGE_SPCECS.SMALL.length,
              width: PACKAGE_SPCECS.SMALL.width,
              breadth: PACKAGE_SPCECS.SMALL.breadth,
              weight: PACKAGE_SPCECS.SMALL.weight
            }
      partnerCouriers = await LogisticsAggregator.getAggregator(partner as any).courierServiceability({
        parcel: {
          sourcePostalCode: sourcePostalCode,
          sourceLatlng: { lat: sourceZipCodeLatlng[0], lng: sourceZipCodeLatlng[1] },
          destinationPostalCode: destinationPostalCode,
          destinationLatlng: { lat: destinationZipCodeLatlng[0], lng: destinationZipCodeLatlng[1] },
          weight: packageSpecs.weight,
          volume: {
            height: packageSpecs.height,
            width: packageSpecs.width,
            breadth: packageSpecs.breadth
          }
        },
        hyperlocal: onlyLocal
      })
    }

    if (onlyLocal || qcCheck)
      partnerCouriers = (partnerCouriers ?? []).filter((pc) => {
        if (onlyLocal && qcCheck) return pc.isHyperlocal && pc.qcCheck
        if (onlyLocal) return pc.isHyperlocal
        if (qcCheck) return pc.qcCheck
      })

    if (search) {
      const regex = new RegExp(search, 'i')
      partnerCouriers = (partnerCouriers ?? []).filter((pc) => regex.test(pc.name))
    }

    return partnerCouriers //.slice(skip, skip + limit)
  }

  async handleShiprocketQuickRequest(params: any): Promise<Array<any>> {
    const { partner = 'shiprocketQuick', sourcePostalCode, destinationPostalCode } = params

    const zipCodes = await ZipCodesModel.find({
      zipCode: { $in: [sourcePostalCode, destinationPostalCode] }
    }).lean()

    const sourceZipCode = zipCodes.find((z) => z.zipCode === sourcePostalCode)
    const destinationZipCode = zipCodes.find((z) => z.zipCode === destinationPostalCode)
    if (!sourceZipCode) throw new BadRequest('Source zip code not available in system')
    if (!destinationZipCode) throw new BadRequest('Destination zip code not available in system')

    const sourceZipCodeLatlng = sourceZipCode.location.coordinates
    const destinationZipCodeLatlng = destinationZipCode.location.coordinates

    const partnerCouriers = await LogisticsAggregator.getAggregator(partner as any).courierServiceability({
      pickupPostcode: sourcePostalCode,
      latFrom: sourceZipCodeLatlng[1],
      longFrom: sourceZipCodeLatlng[0],
      deliveryPostcode: destinationPostalCode,
      latTo: destinationZipCodeLatlng[1],
      longTo: destinationZipCodeLatlng[0]
    })

    return partnerCouriers
  }

  async handleDelhiveryRequest(params: any): Promise<Array<any>> {
    const { partner = AVAILABLE_LOGISTICS.DELHIVERY, sourcePostalCode, destinationPostalCode } = params

    const zipCodes = await ZipCodesModel.find({
      zipCode: { $in: [sourcePostalCode, destinationPostalCode] }
    }).lean()

    const sourceZipCode = zipCodes.find((z) => z.zipCode === sourcePostalCode)
    const destinationZipCode = zipCodes.find((z) => z.zipCode === destinationPostalCode)
    if (!sourceZipCode) throw new BadRequest('Source zip code not available in system')
    if (!destinationZipCode) throw new BadRequest('Destination zip code not available in system')

    const partnerCouriers = await LogisticsAggregator.getAggregator(partner as any).courierServiceability({
      originPin: sourcePostalCode,
      destinationPin: destinationPostalCode,
      fetchTat: true
    })

    return partnerCouriers
  }

  async get(id: Id, _params?: ServiceParams): Promise<any> {
    return {}
  }

  async create(data: LogisticsData, params?: ServiceParams): Promise<any> {
    return {}
  }

  async patch(id: NullableId, data: LogisticsPatch, _params?: ServiceParams): Promise<any> {
    return {}
  }

  async remove(id: NullableId, _params?: ServiceParams): Promise<any> {
    return {}
  }
}

export class LogisticsRuleDeliveryZonesService<ServiceParams extends LogisticsParams = LogisticsParams>
  implements ServiceInterface<Logistics, LogisticsData, ServiceParams, LogisticsPatch>
{
  constructor(public options: LogisticsServiceOptions) {}

  async find(params?: any): Promise<any> {
    const {
      query: { skip = 0, limit = 10 },
      route: { ruleId }
    } = params

    const logisticsRule = await LogisticsRulesModel.findById(ruleId).lean()
    if (!logisticsRule) throw new BadRequest('Rule not found')

    const deliveryZones = await DeliveryPoliciesModel.find({ _id: { $in: logisticsRule.deliveryZones } })
      .skip(skip)
      .limit(limit)
      .lean()

    const errors = []

    for (const zone of deliveryZones) {
      const { isOneDayDeliveryAvailable, isStandardDeliveryAvailable } = zone

      if (isOneDayDeliveryAvailable) {
        const isOneDayDeliveryCourier = logisticsRule?.couriers?.find(
          (courier) => courier.deliveryMode === 'oneDay'
        )

        if (!isOneDayDeliveryCourier) {
          errors.push({
            deliveryZone: zone.zoneName,
            error: 'No courier found with one day delivery mode'
          })
        }
      }

      if (isStandardDeliveryAvailable) {
        const isStandardDeliveryCourier = logisticsRule?.couriers?.find(
          (courier) => courier.deliveryMode === 'standard'
        )

        if (!isStandardDeliveryCourier) {
          errors.push({
            deliveryZone: zone.zoneName,
            error: 'No courier found with standard delivery mode'
          })
        }
      }
    }

    const total = await DeliveryPoliciesModel.find({
      _id: { $in: logisticsRule.deliveryZones }
    }).countDocuments()

    return {
      data: deliveryZones,
      skip,
      limit,
      total,
      errors
    }
  }

  async get(id: Id, _params?: ServiceParams): Promise<any> {
    return {}
  }

  async create(data: LogisticsData, params?: any): Promise<any> {
    const {
      route: { ruleId }
    } = params
    const { deliveryPolicyId } = data

    const logisticsRule = await LogisticsRulesModel.findById(ruleId).lean()
    if (!logisticsRule) throw new BadRequest('Rule not found')

    if (!deliveryPolicyId?.length) throw new BadRequest('Delivery policy id is not provided')

    const addedZones = logisticsRule?.deliveryZones?.map((dz) => dz.toString()) ?? []

    const zonesToBeAdded =
      deliveryPolicyId.map((d) => d.toString()).filter((dp: any) => !addedZones.includes(dp)) ?? []
    if (zonesToBeAdded.length)
      await LogisticsRulesModel.findByIdAndUpdate(ruleId, {
        $push: { deliveryZones: zonesToBeAdded.map((z: string) => new Types.ObjectId(z)) }
      })

    return {}
  }

  async patch(id: NullableId, data: LogisticsPatch, _params?: ServiceParams): Promise<any> {
    return {}
  }

  async remove(id: NullableId, params?: any): Promise<any> {
    const {
      route: { ruleId }
    } = params

    const logisticsRule = await LogisticsRulesModel.findById(ruleId).lean()
    if (!logisticsRule) throw new BadRequest('Rule not found')

    if (!id) throw new BadRequest('Delivery policy id is not provided')

    await LogisticsRulesModel.findByIdAndUpdate(ruleId, {
      $pull: { deliveryZones: new Types.ObjectId(id as string) }
    })

    return {}
  }
}

export class LogisticsRuleCouriersService<ServiceParams extends LogisticsParams = LogisticsParams>
  implements ServiceInterface<Logistics, LogisticsData, ServiceParams, LogisticsPatch>
{
  constructor(public options: LogisticsServiceOptions) {}

  async find(params?: any): Promise<any> {
    const {
      query: { skip = 0, limit = 10 },
      route: { ruleId }
    } = params

    const logisticsRule = await LogisticsRulesModel.findById(ruleId).lean()
    if (!logisticsRule) throw new BadRequest('Rule not found')

    const data = logisticsRule.couriers?.slice(skip, skip + limit) || []

    return {
      data,
      skip,
      limit,
      total: logisticsRule.couriers?.length || 0
    }
  }

  async get(id: Id, _params?: ServiceParams): Promise<any> {
    return {}
  }

  async create(data: LogisticsData, params?: any): Promise<any> {
    const {
      route: { ruleId }
    } = params
    const { couriers, packageSize } = data
    if (!packageSize) throw new BadRequest('Package size not provided')

    const logisticsRule = await LogisticsRulesModel.findById(ruleId).lean()
    if (!logisticsRule) throw new BadRequest('Rule not found')

    if (!couriers?.length) throw new BadRequest('Couriers data not provided')

    const partner = couriers[0].partner

    switch (partner) {
      case AVAILABLE_LOGISTICS.SHIPROCKET:
        return await this.handleAddShipRocketCouriers(logisticsRule, data)

      case AVAILABLE_LOGISTICS.SHIPROCKET_QUICK:
        return await this.handleShiprocketQuickCouriers(logisticsRule, data)

      case AVAILABLE_LOGISTICS.DELHIVERY:
        return await this.handleDelhiveryCouriers(logisticsRule, data)

      default:
        throw new BadRequest('Couriers partner not found!')
    }
  }

  async handleAddShipRocketCouriers(logisticsRule: any, data: any) {
    const { couriers, packageSize } = data
    const partner = 'shiprocket'
    const partnerCourierIds = couriers.map((c: any) => c.partnerCourierId)

    // Fetch partner couriers list
    const partnerCouriers = await (LogisticsAggregator.getAggregator(partner) as Shiprocket).listOfCouriers()

    // Filter already added couriers for the partner
    const alreadyAdded = (logisticsRule.couriers ?? [])
      .filter((c: any) => c.partner === partner && partnerCourierIds.includes(c.partnerCourierId))
      .map((c: any) => ({
        ...c,
        packageSize: c.packageSize?.includes(packageSize)
          ? c.packageSize
          : [...(c.packageSize ?? []), packageSize]
      }))

    const alreadyAddedPartnerCourierIds = new Set(alreadyAdded.map((c: any) => c.partnerCourierId))

    // Find new couriers that need to be added
    const toBeAdded = couriers
      .filter((c: any) => !alreadyAddedPartnerCourierIds.has(c.partnerCourierId))
      .map((c: any) => {
        const courierDetails = partnerCouriers.find((cd) => cd.id === c.partnerCourierId)
        return courierDetails
          ? {
              ...c,
              partnerCourierName: courierDetails.name,
              packageSize: [packageSize],
              deliveryMode: 'standard'
            }
          : null
      })
      .filter(Boolean) // Removes null values

    // Merge updated couriers with the existing rule
    const updatedRuleCouriers = (logisticsRule.couriers ?? []).map(
      (ruleCourier: any) =>
        alreadyAdded.find(
          (c: any) => c.partner === partner && c.partnerCourierId === ruleCourier.partnerCourierId
        ) ?? ruleCourier
    )

    updatedRuleCouriers.push(...toBeAdded)

    await LogisticsRulesModel.findByIdAndUpdate(logisticsRule?._id, {
      couriers: updatedRuleCouriers
    })
  }

  async handleShiprocketQuickCouriers(logisticsRule: any, data: any) {
    const { couriers } = data

    const newCouriers = (couriers ?? [])?.map((c: any) => {
      return {
        deliveryMode: 'oneDay',
        partner: 'shiprocketQuick',
        partnerCourierName: 'Shiprocket Quick',
        partnerCourierId: c.partnerCourierId,
        packageSize: ['small']
      }
    })

    await LogisticsRulesModel.findByIdAndUpdate(logisticsRule?._id, {
      $push: { couriers: { $each: newCouriers } }
    })

    return {}
  }

  async handleDelhiveryCouriers(logisticsRule: any, data: any) {
    const { couriers, packageSize } = data

    const newCouriers = (couriers ?? [])?.map((c: any) => {
      return {
        deliveryMode: 'standard',
        partner: 'Delhivery Tracking',
        partnerCourierName: 'Delhivery Tracking',
        partnerCourierId: c.partnerCourierId,
        packageSize: [packageSize]
      }
    })

    await LogisticsRulesModel.findByIdAndUpdate(logisticsRule?._id, {
      $push: { couriers: { $each: newCouriers } }
    })

    return {}
  }

  async patch(id: NullableId, data: LogisticsPatch, _params?: ServiceParams): Promise<any> {
    return {}
  }

  async remove(id: NullableId | any, params?: any): Promise<any> {
    const {
      route: { ruleId },
      query: { partner }
    } = params

    const logisticsRule = await LogisticsRulesModel.findById(ruleId).lean()
    if (!logisticsRule) throw new BadRequest('Rule not found')

    if (!id || !partner) throw new BadRequest('Both partner and partner courier id is required')

    const safeString = (id ?? '').replace('%%', '%25%')
    const decodedPartnerCourierId = decodeURIComponent(safeString)

    await LogisticsRulesModel.findByIdAndUpdate(ruleId, {
      $pull: {
        couriers: {
          partner,
          partnerCourierId: decodedPartnerCourierId
        }
      }
    })

    return {}
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
