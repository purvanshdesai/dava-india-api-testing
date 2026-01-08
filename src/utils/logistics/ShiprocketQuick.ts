import jwt, { JwtPayload } from 'jsonwebtoken'
import { CourierAggregator } from './CourierAggregator'
import axios from '../axios'
import {
  QuickCourierServiceabilityParams,
  QuickCourierServiceabilityResponse,
  PickupAddressParams,
  PickupAddressResponse,
  QuickCreateOrderResponse,
  AssignAWBResponse,
  CancelOrderParams,
  CancelOrderResponse,
  ScanData,
  AddStorePickupLocationResponse,
  CancelShipmentParams,
  CancelShipmentResponse,
  CreateOrderParams,
  CreateOrderResponse,
  GenerateAWBParams
} from './types'

import { AppDataModel, CONSTANTS } from '../../services/app-data/app-data.schema'
import moment from 'moment-timezone'
import { logger } from '../../logger'

const AUTH_API = 'https://apiv2.shiprocket.in/v1/external/auth/login'
const CHECK_COURIER_SERVICEABILITY = 'https://apiv2.shiprocket.in/v1/external/courier/serviceability'
const CREATE_ORDER = 'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc'
const GENERATE_AWB = 'https://apiv2.shiprocket.in/v1/external/courier/assign/awb'
const ADD_PICKUP_LOCATION = 'https://apiv2.shiprocket.in/v1/external/settings/company/addpickup'
const CANCEL_ORDER = 'https://apiv2.shiprocket.in/v1/external/orders/cancel'
const CANCEL_SHIPMENT = 'https://apiv2.shiprocket.in/v1/external/orders/cancel/shipment/awbs'
const RIDER_TRACKING_URL = 'https://apiv2.shiprocket.in/v1/external/courier/hyperlocal/get_rider_data'

export const ShipRocketQuickToSystemActivityMapping: any = {
  '6': 'shipped', // shipped
  '7': 'delivered',
  '8': 'logistics_cancelled', // cancelled
  '10': 'rto_delivered', // RTO delivered
  '15': 'pickup_rescheduled', // Pickup rescheduled
  '17': 'out_for_delivery', // out for derlivery
  '18': 'in_transit', // in transit
  '19': 'out_for_pickup', // out for pickup
  '21': 'undelivered', // undelivered
  '22': 'delayed', // delayed
  '26': 'fulfilled', // fulfilled
  '42': 'picked_up', // picked up
  '45': 'cancelled_before_dispatch', // cancelled before dispatch
  '46': 'rto_in_transit', // RTO in transit
  '47': 'qc_failed', // qc failed
  '51': 'handover_to_courier', // handover to courier
  '52': 'shipment_booked' // shipment booked
}

export class ShiprocketQuick implements CourierAggregator {
  private email: string = ''
  private password: string = ''
  private token: string = ''
  private tokenExpiry: number = 0
  private partnerCouriersList: any[] = []
  private courierListFetchedAt = 0

  constructor({ email, password }: { email: string; password: string }) {
    this.email = email
    this.password = password
  }

  async getAuthorization(invalidate?: boolean): Promise<any> {
    try {
      if (!invalidate && this.token && this.tokenExpiry > Date.now()) {
        return this.token
      }
      const resp = await axios.post(AUTH_API, { email: this.email, password: this.password })
      this.token = resp.data.token
      const decoded = jwt.decode(this.token) as JwtPayload | null
      if (decoded && decoded.exp) this.tokenExpiry = decoded.exp * 1000

      return this.token
    } catch (err) {
      // console.log('Error in Shiprocket.getAuthorization')
      throw err
    }
  }

  async courierServiceability(
    params: QuickCourierServiceabilityParams
  ): Promise<QuickCourierServiceabilityResponse[]> {
    try {
      const { pickupPostcode, latFrom, longFrom, deliveryPostcode, latTo, longTo } = params

      const requestData = {
        pickup_postcode: pickupPostcode,
        lat_from: latFrom,
        long_from: longFrom,
        delivery_postcode: deliveryPostcode,
        lat_to: latTo,
        long_to: longTo,
        is_new_hyperlocal: 1 // Ensure proper type
      }

      type ApiResponse = {
        message?: string
        status: boolean
        data: QuickCourierServiceabilityResponse[] // Ensure correct type
      }

      const resp = await axios.get<ApiResponse>(CHECK_COURIER_SERVICEABILITY, {
        headers: { Authorization: `Bearer ${this.token}` },
        params: requestData
      })

      const response = resp?.data

      // console.log('Shiprocket Serviceability Check ==> ', response)

      if (!response.status || !Array.isArray(response.data)) {
        throw new Error(response?.message ?? 'No Courier found for this request!')
      }

      return (response.data ?? [])?.map((d: any) => {
        const res: QuickCourierServiceabilityResponse = {
          id: d.courier_name,
          name: d.courier_name,
          charges: d.rates,
          etdHours: d?.etd_hours,
          etd: d?.etd,
          etdDays: Math.ceil(d?.etd_hours / 24)
        }
        return res
      })
    } catch (err: any) {
      logger.error('Error in courierServiceability', err?.response?.data)
      // console.error('Error in courierServiceability', err, JSON.stringify(params))
      throw err
    }
  }

  // Function to add a pickup location
  async addStorePickupLocation(params: PickupAddressParams): Promise<AddStorePickupLocationResponse> {
    try {
      const requestData = {
        pickup_location: params.pickupLocation,
        name: params.name,
        email: params.email,
        phone: params.phone,
        address: params.address,
        address_2: params.address2 || '',
        city: params.city,
        state: params.state,
        country: params.country,
        pin_code: params.pinCode,
        lat: params.lat || '',
        long: params.long || '',
        is_hyperlocal: 1
      }

      const response = await axios.post<PickupAddressResponse>(ADD_PICKUP_LOCATION, requestData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`
        }
      })

      const { data } = response

      if (!data.success) throw new Error('Failed to add pickup location')

      return { pickupLocationId: `${data.pickup_id}` }
    } catch (err: any) {
      logger.error('Error in ShiprocketQuick.addPickupAddress', err?.response?.data)
      // console.log('Error in ShiprocketQuick.addPickupAddress', err?.response?.data, JSON.stringify(params))
      throw err
    }
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
    try {
      const { parcel, orderDetails, deliveryCoordinates } = params
      const requestData = {
        order_id: orderDetails.orderId,
        order_date: orderDetails.orderDate,
        billing_customer_name: orderDetails.deliveryDetails.firstName,
        billing_last_name: orderDetails.deliveryDetails.lastName,
        billing_address: orderDetails.deliveryDetails.address,
        billing_city: orderDetails.deliveryDetails.city,
        billing_pincode: orderDetails.deliveryDetails.pinCode,
        billing_state: orderDetails.deliveryDetails.state,
        billing_country: orderDetails.deliveryDetails.country,
        billing_email: orderDetails.deliveryDetails.email,
        billing_phone: Number(orderDetails.deliveryDetails.phoneNo),
        order_items: orderDetails.orderItems.map((i) => ({
          name: i.name,
          sku: i.sku,
          units: i.units,
          selling_price: i.sellingPrice
        })),
        sub_total: orderDetails.subTotal,
        length: parcel.volume.width,
        breadth: parcel.volume.breadth,
        height: parcel.volume.height,
        weight: parcel.weight,
        pickup_location: orderDetails.pickupLocation,
        payment_method: 'Prepaid',
        shipping_is_billing: true,
        latitude: deliveryCoordinates.latitude,
        longitude: deliveryCoordinates.longitude,
        shipping_method: 'HL'
      }

      // console.log('Shiprocket Quick Order Request: ', requestData)

      const response = await axios.post<QuickCreateOrderResponse>(CREATE_ORDER, requestData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`
        }
      })

      const { data } = response

      // console.log('shipmentdata after creating', data)

      return {
        partnerOrderId: `${data.order_id}`,
        shipmentId: data.shipment_id,
        status: data.status,
        statusCode: data.status_code
      }
    } catch (error: any) {
      logger.error('❌ Error in ShiprocketService.createOrder:', error?.response?.data)
      // console.error(
      //   '❌ Error in ShiprocketService.createOrder:',
      //   error?.response?.data,
      //   JSON.stringify(params)
      // )
      throw error
    }
  }

  async generateAWB(params: GenerateAWBParams): Promise<AssignAWBResponse> {
    // console.log('generate awb data ==== ', params)
    try {
      const requestData = {
        shipment_id: params.shipmentId,
        courier_id: params.courierId || '' // Optional
      }

      const response = await axios.post<AssignAWBResponse>(GENERATE_AWB, requestData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`
        }
      })

      return response.data
    } catch (error: any) {
      logger.error('❌ Error in ShiprocketService.assignAWB:', error?.response?.data)
      // console.error('❌ Error in ShiprocketService.assignAWB:', error?.response?.data, JSON.stringify(params))
      throw error
    }
  }

  async cancelOrder(params: CancelOrderParams): Promise<CancelOrderResponse> {
    try {
      const requestData = {
        ids: params.ids || []
        // awb_codes: params.awb_codes || [],
        // channel_order_ids: params.channel_order_ids || []
      }

      const response = await axios.post<CancelOrderResponse>(CANCEL_ORDER, requestData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`
        }
      })

      return response.data
    } catch (error: any) {
      logger.error('❌ Error in ShiprocketService.assignAWB:', error?.response?.data)
      // console.error(
      //   '❌ Error in ShiprocketService.cancelOrder:',
      //   error?.response?.data,
      //   JSON.stringify(params)
      // )
      throw error
    }
  }

  async cancelShipment({ awbNo }: CancelShipmentParams): Promise<CancelShipmentResponse> {
    try {
      const requestData: { awbs: string[] } = { awbs: [awbNo] }
      const resp = await axios.post<{
        message: string
      }>(CANCEL_SHIPMENT, requestData, {
        headers: { Authorization: `Bearer ${this.token}` }
      })
      const { data } = resp
      return {
        message: data.message
      }
    } catch (err: any) {
      logger.error('❌ Error in ShiprocketService.cancelShipment:', err?.response?.data)
      // console.log('Error in Shiprocket.cancelShipment', err, awbNo)
      throw err
    }
  }

  async fetchRiderLocation(shipmentId: string) {
    if (!shipmentId) {
      throw new Error('Shipment ID is required to fetch rider location')
    }

    if (!this.token) {
      throw new Error('Shiprocket token is not configured')
    }

    const response = await axios.get(`${RIDER_TRACKING_URL}/${shipmentId}`, {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    })

    const data = response.data || {}
    console.log('🚀 ~ fetchRiderLocation ~ data:', data)
    return {
      name: data.rider_name,
      phone: data.rider_phone,
      lat: data.rider_lat,
      lng: data.rider_long,
      status: data.status_name,
      courier: data.courier_name
    }
  }
}

export const shipRocketQuickTrackingActivityMapping = async (trackingActivity: any) => {
  const systemTrackingActivities = await AppDataModel.find({ type: CONSTANTS.TYPE.TRACKING_STATUS }).lean()

  const { current_timestamp, status, shipment_status_id } = trackingActivity

  const activityCode = shipment_status_id?.toString()
  const systemActivity: any = {
    date: moment().utc().toDate(),
    dateTime: moment().format('DD-MM-YYYY HH:mm:ss'),
    authorType: 'logistics',
    authorName: 'Shiprocket Quick Logistics',
    status
  }

  if (ShipRocketQuickToSystemActivityMapping[activityCode]) {
    systemActivity.statusCode = ShipRocketQuickToSystemActivityMapping[activityCode]

    const systemActivityData = systemTrackingActivities.find(
      (a) => a.statusCode === systemActivity.statusCode
    )

    if (systemActivityData) {
      systemActivity.label = systemActivityData.name
    }
  }

  return systemActivity
}
