import { Shiprocket } from './Shiprocket'
import { ShiprocketQuick } from './ShiprocketQuick'
import { Swiggy } from './Swiggy'

import { feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'
import {
  AddStorePickupLocationParams,
  CreateOrderParams,
  GenerateAWBParams,
  ReturnOrderParams,
  SchedulePickupParams,
  SyncTrackingParams
} from './types'
import { DelhiveryClient } from './Delhivery/delhivery'

const app = feathers().configure(configuration())

export const AVAILABLE_LOGISTICS = {
  SHIPROCKET: 'shiprocket',
  SHIPROCKET_QUICK: 'shiprocketQuick',
  DELHIVERY: 'delhivery'
} as const

export const SUPPORTED_LOGISTICS = ['shiprocket', 'shiprocketQuick', 'swiggy', 'delhivery'] as const
export const STANDARD_DELIVERY_LOGISTICS = ['shiprocket', 'delhivery'] as const
export const ONEDAY_DELIVERY_LOGISTICS = ['swiggy', 'shiprocketQuick'] as const
export const DELIVERY_MODES = {
  STANDARD: 'standard',
  ONE_DAY: 'oneDay'
}
export type supportedLogistics = (typeof SUPPORTED_LOGISTICS)[number]

class Logistics {
  static _instance: Logistics | undefined

  private aggregators!: {
    shiprocket: Shiprocket
    shiprocketQuick: ShiprocketQuick
    swiggy: Swiggy
    delhivery: DelhiveryClient
  }

  constructor() {
    if (Logistics._instance instanceof Logistics) {
      return Logistics._instance
    }

    const config = app.get('logistics')

    if (!config) return

    const { shiprocket: shiprocketConfig, swiggy, delhivery } = config
    // Initialize the `aggregators` property
    this.aggregators = {
      shiprocket: new Shiprocket({ email: shiprocketConfig.email, password: shiprocketConfig.password }),
      shiprocketQuick: new ShiprocketQuick({
        email: shiprocketConfig.email,
        password: shiprocketConfig.password
      }),
      swiggy: new Swiggy(swiggy),
      delhivery: new DelhiveryClient({
        token: delhivery.apiToken!,
        env: delhivery.env === 'prod' ? 'prod' : 'staging'
      })
    }

    if (shiprocketConfig.email && shiprocketConfig.password) this.aggregators?.shiprocket?.getAuthorization()

    if (shiprocketConfig.email && shiprocketConfig.password)
      this.aggregators?.shiprocketQuick?.getAuthorization()

    Logistics._instance = this
  }

  getAggregator(name: supportedLogistics) {
    if (!this.aggregators[name]) throw new Error(`Unsupported aggregator - ${name}`)

    return this.aggregators[name]
  }

  listOfCouriers(name: supportedLogistics) {
    if (name === 'shiprocket') {
      return this.aggregators.shiprocket.listOfCouriers?.() ?? []
    }
    return []
  }

  courierServiceability(name: supportedLogistics, criteria: any) {
    return this.getAggregator(name).courierServiceability(criteria)
  }

  createOrder(name: supportedLogistics, orderDetails: CreateOrderParams) {
    return this.getAggregator(name).createOrder(orderDetails)
  }

  cancelOrder(name: supportedLogistics, orderId: string, opts: any = {}) {
    return this.getAggregator(name).cancelOrder(orderId, opts)
  }

  generateAWB(name: supportedLogistics, params: GenerateAWBParams) {
    if (name === AVAILABLE_LOGISTICS.SHIPROCKET) {
      return this.aggregators.shiprocket.generateAWB(params)
    }

    return {}
  }

  shipmentPickup(name: supportedLogistics, params: SchedulePickupParams) {
    if (name === AVAILABLE_LOGISTICS.SHIPROCKET) {
      return this.aggregators.shiprocket.schedulePickup(params)
    }

    return {}
  }

  getTrackingData(name: supportedLogistics, trackingId: any) {
    if (name === AVAILABLE_LOGISTICS.SHIPROCKET) {
      return this.aggregators.shiprocket.getTrackingData(trackingId)
    }

    return {}
  }

  syncTrackingData(name: supportedLogistics, params: SyncTrackingParams) {
    if (name === AVAILABLE_LOGISTICS.SHIPROCKET) {
      return this.aggregators.shiprocket.syncTrackingData(params)
    }
    return {}
  }

  addStorePickupLocation(name: supportedLogistics, data: AddStorePickupLocationParams) {
    if (name === AVAILABLE_LOGISTICS.SHIPROCKET) {
      return this.aggregators.shiprocket.addStorePickupLocation(data)
    }
    return {}
  }

  createReturnOrder(name: supportedLogistics, params: ReturnOrderParams) {
    if (name === AVAILABLE_LOGISTICS.SHIPROCKET) {
      return this.aggregators.shiprocket.createReturnOrder(params)
    }
    return null
  }

  fetchRiderLocation(name: supportedLogistics, shipmentId: string) {
    if (name === AVAILABLE_LOGISTICS.SHIPROCKET) {
      return this.aggregators.shiprocketQuick.fetchRiderLocation(shipmentId)
    }

    return {}
  }
}

export default new Logistics()
