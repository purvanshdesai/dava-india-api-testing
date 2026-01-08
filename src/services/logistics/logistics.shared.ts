// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import {
  CourierPartnersService,
  Logistics,
  LogisticsData,
  LogisticsRuleDeliveryZonesService,
  LogisticsPatch,
  LogisticsQuery,
  LogisticsService
} from './logistics.class'
import { ZipCodesModel } from '../zip-codes/zip-codes.schema'
import LogisticsAggregator from '../../utils/logistics/Logistics'
import { BadRequest } from '@feathersjs/errors'

export type { Logistics, LogisticsData, LogisticsPatch, LogisticsQuery }

export type LogisticsClientService = Pick<
  LogisticsService<Params<LogisticsQuery>>,
  (typeof logisticsMethods)[number]
>

export const logisticsPath = 'logistics'
export const courierPartnersPath = 'logistics/courier-partners'
export const logisticsRuleDeliveryZonesPath = 'logistics/:ruleId/delivery-zones'
export const logisticsRuleCouriersPath = 'logistics/:ruleId/couriers'

export const logisticsMethods: Array<keyof LogisticsService> = ['find', 'get', 'create', 'patch', 'remove']
export const courierPartnersMethods: Array<keyof CourierPartnersService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]
export const logisticsRuleDeliveryZonesMethods: Array<keyof LogisticsRuleDeliveryZonesService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]
export const logisticsRuleCouriersMethods: Array<keyof LogisticsRuleDeliveryZonesService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]
export const logisticsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(logisticsPath, connection.service(logisticsPath), {
    methods: logisticsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [logisticsPath]: LogisticsClientService
  }
}

export const handleSwiggyServiceabilityCheck = async (params: {
  sourcePostalCode: string
  destinationPostalCode: string
  pickupCoords?: { lat: number; lng: number }
  dropCoords?: { lat: number; lng: number }
}): Promise<Array<any>> => {
  const partner = 'swiggy' as string

  const { sourcePostalCode, destinationPostalCode, pickupCoords, dropCoords } = params

  const zipCodes = await ZipCodesModel.find({
    zipCode: { $in: [sourcePostalCode, destinationPostalCode] }
  }).lean()

  const sourceZipCode = zipCodes.find((z) => z.zipCode === sourcePostalCode)
  if (!sourceZipCode) throw new BadRequest('Source zip code not available in system')

  const destinationZipCode = zipCodes.find((z) => z.zipCode === destinationPostalCode)
  if (!destinationZipCode) throw new BadRequest('Destination zip code not available in system')

  const result = await LogisticsAggregator.getAggregator(partner as any).courierServiceability({
    partnerOrderId: 'order_davaindia',
    // REVERT
    // pickupLat: 19.105264636159944,
    // pickupLng: 72.88214570100811,
    // dropLat: 19.105264636159944,
    // dropLng: 72.88214570100811
    pickupLat: pickupCoords ? pickupCoords?.lat : sourceZipCode?.location?.coordinates[1],
    pickupLng: pickupCoords ? pickupCoords?.lng : sourceZipCode?.location?.coordinates[0],
    dropLat: dropCoords ? dropCoords?.lat : destinationZipCode?.location?.coordinates[1],
    dropLng: dropCoords ? dropCoords?.lng : destinationZipCode?.location?.coordinates[0]
  })

  const { serviceabilityResult, slaMaxMinutes } = result

  if (serviceabilityResult?.status === 'SERVICEABLE') {
    return [
      {
        id: 'swiggy',
        name: 'Swiggy Genie',
        isHyperlocal: true,
        charges: null,
        etdHours: 0,
        etdMinutes: slaMaxMinutes,
        etd: '',
        etdDays: slaMaxMinutes,
        //REVERT
        // pickupLat: 19.105264636159944,
        // pickupLng: 72.88214570100811,
        // dropLat: 19.105264636159944,
        // dropLng: 72.88214570100811
        pickupLat: pickupCoords ? pickupCoords?.lat : sourceZipCode?.location?.coordinates[1],
        pickupLng: pickupCoords ? pickupCoords?.lng : sourceZipCode?.location?.coordinates[0],
        dropLat: dropCoords ? dropCoords?.lat : destinationZipCode?.location?.coordinates[1],
        dropLng: dropCoords ? dropCoords?.lng : destinationZipCode?.location?.coordinates[0]
      }
    ]
  }

  return []
}
