import jwt, { JwtPayload } from 'jsonwebtoken'
import { CourierAggregator } from './CourierAggregator'
import axios from '../axios'
import {
  AddStorePickupLocationParams,
  AddStorePickupLocationResponse,
  CancelShipmentParams,
  CancelShipmentResponse,
  CourierPartner,
  CourierServiceabilityParams,
  CourierServiceabilityResponse,
  CreateOrderParams,
  CreateOrderResponse,
  GenerateAWBParams,
  GenerateAWBResponse,
  GenerateLabelParams,
  GenerateLabelResponse,
  GenerateManifestParams,
  GenerateManifestResponse,
  ReturnOrderParams,
  ReturnOrderResponse,
  SchedulePickupParams,
  ReSchedulePickupParams,
  SchedulePickupResponse,
  ShipmentTrackingResponse,
  SyncTrackingParams,
  ScanData
} from './types'
import ShipRocketCouriersCache from '../../cache/redis/shipRocketCouriers'
import { AppDataModel, CONSTANTS } from '../../services/app-data/app-data.schema'
import moment from 'moment-timezone'
import { logger } from '../../logger'

const AUTH_API = 'https://apiv2.shiprocket.in/v1/external/auth/login'
const LIST_OF_COURIERS = 'https://apiv2.shiprocket.in/v1/external/courier/courierListWithCounts'
const CHECK_COURIER_SERVICEABILITY = 'https://apiv2.shiprocket.in/v1/external/courier/serviceability'
const CREATE_ORDER = 'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc'
const GENERATE_AWB = 'https://apiv2.shiprocket.in/v1/external/courier/assign/awb'
const ADD_PICKUP_LOCATION = 'https://apiv2.shiprocket.in/v1/external/settings/company/addpickup'
const SCHEDULE_PICKUP = 'https://apiv2.shiprocket.in/v1/external/courier/generate/pickup'
const RESCHEDULE_PICKUP = 'https://apiv2.shiprocket.in/v1/external/courier/generate/pickup'
const CANCEL_ORDER = 'https://apiv2.shiprocket.in/v1/external/orders/cancel'
const CANCEL_SHIPMENT = 'https://apiv2.shiprocket.in/v1/external/orders/cancel/shipment/awbs'
const GET_TRACKING = 'https://apiv2.shiprocket.in/v1/external/courier/track/awb/'
const GENERATE_MANIFEST = 'https://apiv2.shiprocket.in/v1/external/manifests/generate'
const GENERATE_LABEL = 'https://apiv2.shiprocket.in/v1/external/courier/generate/label'
const CREATE_RETURN_ORDER = 'https://apiv2.shiprocket.in/v1/external/orders/create/return'

export const ShipRocketToSystemActivityMapping: any = {
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

export class Shiprocket implements CourierAggregator {
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

  async listOfCouriers(): Promise<CourierPartner[]> {
    try {
      const partnerCourierList = await ShipRocketCouriersCache.getCouriersFromCache()
      if (!partnerCourierList) return []

      return partnerCourierList

    } catch (err: any) {
      logger.error('Error in Shiprocket.listOfCouriers:', err?.response?.data)

      throw err
    }
  }

  async listOfSupportedCouriers(): Promise<Array<any>> {
    interface CourierData {
      is_own_key_courier: number
      ownkey_courier_id: number
      id: number
      min_weight: number
      base_courier_id: number
      name: string
      use_sr_postcodes: number
      type: number
      status: number
      courier_type: number
      master_company: string
      service_type: number
      mode: number
      realtime_tracking: string
      delivery_boy_contact: string
      pod_available: string
      call_before_delivery: string
      activated_date: string
      newest_date: string | null
      shipment_count: string
      is_hyperlocal: number
    }

    interface CourierResponse {
      total_courier_count: number
      serviceable_pincodes_count: string
      pickup_pincodes_count: string
      total_rto_count: number
      total_oda_count: number
      courier_data: CourierData[]
    }

    const resp = await axios.get<CourierResponse>(LIST_OF_COURIERS, {
      headers: { Authorization: `Bearer ${this.token}` }
    })

    this.courierListFetchedAt = Date.now()

    if (!resp.data?.courier_data) return []

    this.partnerCouriersList = resp.data.courier_data.map((d: any) => ({
      id: `${d.id}`,
      name: d.name,
      isHyperlocal: d.is_hyperlocal
    }))

    return this.partnerCouriersList
  }

  async courierServiceability(params: CourierServiceabilityParams): Promise<CourierServiceabilityResponse[]> {
    // Implement serviceability logic based on criteria
    try {
      const { parcel, orderId, qcCheck, hyperlocal, isReturn, declaredValue } = params
      const { sourcePostalCode, destinationPostalCode, volume, weight, sourceLatlng, destinationLatlng } =
        parcel ?? {}

      const requestData: {
        pickup_postcode: number
        delivery_postcode: number
        order_id?: number
        weight?: number
        length?: number
        breadth?: number
        height?: number
        declared_value?: number
        is_return?: 0 | 1 // declared_value is required to use this field
        is_new_hyperlocal?: 1
        // only_local?: 1
        lat_from?: number
        long_from?: number
        lat_to?: number
        long_to?: number
        qc_check?: 1 // is_return has to be 1 to use this field,
        cod: 0
      } = {
        pickup_postcode: Number(sourcePostalCode),
        delivery_postcode: Number(destinationPostalCode),
        cod: 0
      }

      if (orderId) requestData.order_id = orderId
      if (weight) requestData.weight = weight

      if (hyperlocal) {
        requestData.is_new_hyperlocal = 1
        // requestData.only_local = 1
        if (!sourceLatlng) throw new Error('Source coordinates not provided')
        requestData.lat_from = sourceLatlng.lat
        requestData.long_from = sourceLatlng.lng
        if (!destinationLatlng) throw new Error('Destination coordinates not provided')
        requestData.lat_to = destinationLatlng.lat
        requestData.long_to = destinationLatlng.lng
      }
      if (declaredValue) requestData.declared_value = declaredValue

      if (volume && volume.breadth && volume.height && volume.width) {
        requestData.breadth = volume.breadth
        requestData.height = volume.height
        requestData.length = volume.width
      }

      type SuppressionDates = {
        action_on: string
        blocked_fm: string
        blocked_lm: string
        delay_remark?: string
        delivery_delay_by?: number
        delivery_delay_days?: string
        delivery_delay_from?: string
        delivery_delay_to?: string
        pickup_delay_by?: number
        pickup_delay_days?: string
        pickup_delay_from?: string
        pickup_delay_to?: string
      }

      type CourierCompany = {
        air_max_weight: string
        assured_amount: number
        base_courier_id: string | null
        base_weight: string
        blocked: number
        call_before_delivery: string
        charge_weight: number
        city: string
        cod: number
        cod_charges: number
        cod_multiplier: number
        cost: string
        courier_company_id: number
        courier_name: string
        courier_type: string
        coverage_charges: number
        cutoff_time: string
        delivery_boy_contact: string
        delivery_performance: number
        description: string
        edd: string
        entry_tax: number
        estimated_delivery_days: string
        etd: string
        etd_hours: number
        freight_charge: number
        id: number
        is_custom_rate: number
        is_hyperlocal: boolean
        is_international: number
        is_rto_address_available: boolean
        is_surface: boolean
        local_region: number
        metro: number
        min_weight: number
        mode: number
        new_edd: number
        odablock: boolean
        other_charges: number
        others: string
        pickup_availability: string
        pickup_performance: number
        pickup_priority: string
        pickup_supress_hours: number
        pod_available: string
        postcode: string
        qc_courier: number
        rank: string
        rate: number
        rating: number
        realtime_tracking: string
        region: number
        rto_charges: number
        rto_performance: number
        seconds_left_for_pickup: number
        secure_shipment_disabled: boolean
        ship_type: number
        state: string
        suppress_date: string
        suppress_text: string
        suppression_dates: SuppressionDates
        surface_max_weight: string
        tracking_performance: number
        volumetric_max_weight: number | null
        weight_cases: number
        zone: string
      }

      type Data = {
        available_courier_companies: CourierCompany[]
        child_courier_id: number | null
        is_recommendation_enabled: number
        recommendation_advance_rule: number
        recommended_by: {
          id: number
          title: string
        }
        recommended_courier_company_id: number | null
        shiprocket_recommended_courier_id: number | null
      }

      type ApiResponse = {
        company_auto_shipment_insurance_setting: boolean
        covid_zones: {
          delivery_zone: string | null
          pickup_zone: string | null
        }
        currency: string
        data: Data
        dg_courier: number
        eligible_for_insurance: number
        insurace_opted_at_order_creation: boolean
        is_allow_templatized_pricing: boolean
        is_latlong: number
        is_old_zone_opted: boolean
        is_zone_from_mongo: boolean
        label_generate_type: number
        on_new_zone: number
        seller_address: any[]
        status: number
        user_insurance_manadatory: boolean
      }

      const resp = await axios.get<ApiResponse>(CHECK_COURIER_SERVICEABILITY, {
        headers: { Authorization: `Bearer ${this.token}` },
        params: requestData
      })

      const records =
        resp?.data && resp?.data?.data && resp?.data?.data?.available_courier_companies
          ? resp?.data?.data?.available_courier_companies
          : []

      return (records ?? [])?.map((d) => {
        const { courier_name, courier_company_id, is_hyperlocal, freight_charge, etd_hours, etd } = d
        const res: CourierServiceabilityResponse = {
          id: `${courier_company_id}`,
          name: courier_name,
          isHyperlocal: is_hyperlocal,
          charges: freight_charge,
          etdHours: etd_hours,
          etd: etd,
          etdDays: Math.ceil(etd_hours / 24)
        }
        return res
      })

    } catch (err: any) {
      logger.error('Error in Shiprocket.courierServiceability:', err?.response?.data)
      // console.log('Error in Shiprocket.courierServiceability', err, JSON.stringify(params))
      throw err
    }
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
    // console.log('create order data ====', JSON.stringify(params))
    try {
      // Implement logic to create an order
      const { parcel, orderDetails } = params

      const requestData: {
        order_id: string
        order_date: string
        pickup_location: string
        billing_customer_name: string
        billing_last_name: string
        billing_address: string
        billing_city: string
        billing_pincode: number
        billing_state: string
        billing_country: string
        billing_email: string
        billing_phone: number
        shipping_is_billing: boolean
        order_items: { name: string; sku: string; units: number; selling_price: number }[]
        sub_total: number
        length: number
        breadth: number
        height: number
        weight: number
        payment_method: 'Prepaid'
      } = {
        order_id: orderDetails.orderId,
        order_date: orderDetails.orderDate,
        billing_customer_name: orderDetails.deliveryDetails.firstName,
        billing_last_name: orderDetails.deliveryDetails.lastName,
        billing_address: (orderDetails.deliveryDetails.address ?? '').substring(0, 190),
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
        shipping_is_billing: true
      }

      const resp = await axios.post<{
        order_id: number
        channel_order_id: string
        shipment_id: number
        status: string
        status_code: number
        onboarding_completed_now: number
        awb_code: string
        courier_company_id: string
        courier_name: string
        new_channel: boolean
        packaging_box_error: string
      }>(CREATE_ORDER, requestData, {
        headers: { Authorization: `Bearer ${this.token}` }
      })
      const { data } = resp

      console.log('Shiprocket Order create res: ', data)

      return {
        partnerOrderId: `${data.order_id}`,
        orderId: data.channel_order_id,
        shipmentId: data.shipment_id,
        status: data.status,
        statusCode: data.status_code
      }
    } catch (err: any) {

      logger.error('Error in Shiprocket.createOrder:', err?.response?.data)
      // console.log('Error in Shiprocket.createOrder', err, JSON.stringify(params))
      throw err
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      await axios.post(
        CANCEL_ORDER,
        { ids: [orderId] },
        { headers: { Authorization: `Bearer ${this.token}` } }
      )
      return true
    } catch (err) {
      // console.log('Error in Shiprocket.cancelOrder', orderId)
      throw err
    }
  }

  async generateAWB(params: GenerateAWBParams): Promise<GenerateAWBResponse> {
    // console.log('generate awb data ==== ', params)
    try {
      const requestData: {
        shipment_id: number
        courier_id?: number
        status?: string
        is_return?: number
      } = {
        shipment_id: params.shipmentId,
        courier_id: params.courierId
      }
      if (params.isReturn) requestData.is_return = 1

      const resp = await axios.post<{
        awb_assign_status: number
        response: {
          data: {
            awb_assign_error?: string
            courier_company_id: number
            awb_code: string
            cod: number
            order_id: number
            shipment_id: number
            awb_code_status: number
            assigned_date_time: {
              date: string
              timezone_type: number
              timezone: string
            }
            applied_weight: number
            company_id: number
            courier_name: string
            child_courier_name: string | null
            pickup_scheduled_date: string
            routing_code: string
            rto_routing_code: string
            invoice_no: string
            transporter_id: string
            transporter_name: string
            shipped_by: {
              shipper_company_name: string
              shipper_address_1: string
              shipper_address_2: string
              shipper_city: string
              shipper_state: string
              shipper_country: string
              shipper_postcode: string
              shipper_first_mile_activated: number
              shipper_phone: string
              lat: string
              long: string
              shipper_email: string
              rto_company_name: string
              rto_address_1: string
              rto_address_2: string
              rto_city: string
              rto_state: string
              rto_country: string
              rto_postcode: string
              rto_phone: string
              rto_email: string
            }
          }
        }
      }>(GENERATE_AWB, requestData, {
        headers: { Authorization: `Bearer ${this.token}` }
      })
      const {
        data: {
          response: { data }
        }
      } = resp
      if (!data.awb_code && data.awb_assign_error) throw new Error(data.awb_assign_error)
      return { awbNo: data.awb_code }

    } catch (err: any) {
      logger.error('Error in Shiprocket.generateAWB:', err?.response?.data)
      // console.log('Error in Shiprocket.generateAWB', err, JSON.stringify(params))
      throw err
    }
  }

  async getTrackingData(awbNo: string): Promise<ShipmentTrackingResponse> {
    try {
      // Implement logic to fetch tracking data
      const resp = await axios.get<{
        tracking_data: {
          track_status: number
          shipment_status: number
          shipment_track: {
            id: number
            awb_code: string
            courier_company_id: number
            shipment_id: number
            order_id: number
            pickup_date: string
            delivered_date: string
            weight: string
            packages: number
            current_status: string
            delivered_to: string
            destination: string
            consignee_name: string
            origin: string
            courier_agent_details: string | null
            courier_name: string
            edd: string | null
            pod: string
            pod_status: string
          }[]
          shipment_track_activities: {
            date: string
            status: string
            activity: string
            location: string
            'sr-status': string
            'sr-status-label': string
          }[]
          track_url: string
          etd: string
          qc_response: {
            qc_image: string
            qc_failed_reason: string
          }
        }
      }>(`${GET_TRACKING}${awbNo}`, {
        headers: { Authorization: `Bearer ${this.token}` }
      })
      const {
        tracking_data: { track_url, shipment_track_activities, etd, shipment_track }
      } = resp.data
      const { shipment_id, order_id, current_status, courier_name } = shipment_track[0]
      return {
        estimatedTimeOfDelivery: etd,
        trackingUrl: track_url,
        activities: shipment_track_activities ?? [],
        currentStatus: current_status,
        courierName: courier_name,
        shipmentId: `${shipment_id}`,
        partnerOrderId: `${order_id}`
      }

    } catch (err: any) {
      logger.error('Error in Shiprocket.getTrackingData:', err?.response?.data)
      // console.log('Error in Shiprocket.getTrackingData', err, awbNo)
      throw err
    }
  }

  async syncTrackingData(params: SyncTrackingParams): Promise<any> {
    // Implement logic to sync tracking data
    const { awbNo, existingTimeline = [] } = params

    if (!awbNo) throw new Error('AWB no is required to sync tracking data')

    const { activities = [] }: { activities: any[] } = await this.getTrackingData(params?.awbNo)

    const seen = new Set(existingTimeline.map((item) => `${item?.status}-${item?.dateTime}`))

    const filtered: ScanData[] | any = activities?.filter((activity) => {
      const key = `${activity.status}-${activity?.date}`
      if (seen.has(key)) {
        return false // Already exists in DB, skip it
      }
      seen.add(key)
      return true // New entry, include it
    })

    return await shipRocketTrackingActivityMapping(filtered)
  }

  async schedulePickup(params: SchedulePickupParams): Promise<SchedulePickupResponse> {
    try {
      const { pickupDate, status, shipmentId } = params

      const requestData: {
        shipment_id: number
        status?: 'retry'
        pickup_date?: string[]
      } = {
        shipment_id: shipmentId
      }
      if (status) requestData.status = status
      if (pickupDate) requestData.pickup_date = pickupDate

      const resp = await axios.post<{
        pickup_status: number
        response: {
          pickup_scheduled_date: string
          pickup_token_number: string
          status: number
          others: string // JSON string, consider parsing if needed
          pickup_generated_date: {
            date: string
            timezone_type: number
            timezone: string
          }
          data: string
        }
      }>(SCHEDULE_PICKUP, requestData, {
        headers: { Authorization: `Bearer ${this.token}` }
      })

      const { data } = resp

      const extraData = JSON.parse(data?.response?.others ?? '{}')
      extraData.etd_hours = JSON.parse(extraData?.etd_hours ?? '{}')
      return {
        pickupDate: data.response.pickup_scheduled_date,
        pickupTokenNo: data.response.pickup_token_number,
        extraData: {
          recommended_courier_data: extraData.recommended_courier_data,
          etd_hours: extraData.etd_hours
        }
      }

    } catch (err: any) {
      logger.error('Error in Shiprocket.schedulePickup:', err?.response?.data)
      // console.log('Error in Shiprocket.schedulePickup ', err, params)
      throw err
    }
  }

  async reSchedulePickup(params: ReSchedulePickupParams): Promise<SchedulePickupResponse> {
    try {
      const { shipmentId } = params

      const requestData = { shipment_id: shipmentId }

      const resp = await axios.post<{
        pickup_status: number
        response: {
          pickup_scheduled_date: string
          pickup_token_number: string
          status: number
          others: string // JSON string, consider parsing if needed
          pickup_generated_date: {
            date: string
            timezone_type: number
            timezone: string
          }
          data: string
        }
      }>(RESCHEDULE_PICKUP, requestData, {
        headers: { Authorization: `Bearer ${this.token}` }
      })

      // console.log('Responose from Reschedule', resp)

      if (!resp) throw new Error('Error while reschedule pickup!')

      const { data } = resp

      const extraData = JSON.parse(data?.response?.others ?? '{}')
      extraData.etd_hours = JSON.parse(extraData?.etd_hours ?? '{}')
      return {
        pickupDate: data.response.pickup_scheduled_date,
        pickupTokenNo: data.response.pickup_token_number,
        extraData: {
          recommended_courier_data: extraData.recommended_courier_data,
          etd_hours: extraData.etd_hours
        }
      }

    } catch (err: any) {
      logger.error('Error in Shiprocket.schedulePickup:', err?.response?.data)
      // console.log('Error in Shiprocket.schedulePickup ', err, params)
      throw err
    }
  }

  async addStorePickupLocation(
    params: AddStorePickupLocationParams
  ): Promise<AddStorePickupLocationResponse> {
    try {
      const { locationName, name, city, phone, country, email, state, address, pinCode } = params
      const requestData: {
        pickup_location: string
        name: string
        email: string
        phone: number
        address: string
        city: string
        state: string
        country: string
        pin_code: number
      } = {
        pickup_location: locationName,
        name,
        email,
        phone: parseInt(phone),
        address,
        city,
        state,
        country,
        pin_code: parseInt(pinCode)
      }

      const resp = await axios.post<{
        success: boolean
        address: {
          company_id: number
          pickup_code: string
          address: string
          address_2: string
          address_type: string | null
          city: string
          state: string
          country: string
          gstin: string | null
          pin_code: string
          phone: string
          email: string
          name: string
          alternate_phone: string | null
          lat: number | null
          long: number | null
          status: number
          phone_verified: number
          rto_address_id: number
          extra_info: string
          updated_at: string
          created_at: string
          id: number
        }
        pickup_id: number
        company_name: string
        full_name: string
      }>(ADD_PICKUP_LOCATION, requestData, {
        headers: { Authorization: `Bearer ${this.token}` }
      })

      const { data } = resp

      if (!data.success) throw new Error('Failed to add pickup location')

      return { pickupLocationId: `${data.pickup_id}` }
    } catch (err: any) {
      logger.error('Error in Shiprocket.addStorePickupLocation:', err?.response?.data)
      // console.log('Error in Shiprocket.addStorePickupLocation', err, params)
      throw err
    }
  }

  async generateManifest({ shipmentId }: GenerateManifestParams): Promise<GenerateManifestResponse> {
    const requestData: { shipment_id: number[] } = {
      shipment_id: [parseInt(shipmentId)]
    }
    try {
      const resp = await axios.post<{
        status: number
        manifest_url: string
      }>(GENERATE_MANIFEST, requestData, {
        headers: { Authorization: `Bearer ${this.token}` }
      })
      const { data } = resp
      return { success: data.status === 1, manifestUrl: data.manifest_url }
    } catch (err: any) {
      logger.error('Error in Shiprocket.generateManifest:', err?.response?.data)
      // console.log('Error in Shiprocket.generateManifest ', err, shipmentId)
      throw err
    }
  }

  async generateLabel({ shipmentId }: GenerateLabelParams): Promise<GenerateLabelResponse> {
    try {
      const requestData: { shipment_id: number[] } = { shipment_id: [parseInt(shipmentId)] }
      const resp = await axios.post<{
        label_created: number
        label_url: string
        response: string
        not_created: any[]
      }>(GENERATE_LABEL, requestData, {
        headers: { Authorization: `Bearer ${this.token}` }
      })
      const { data } = resp
      return {
        labelUrl: data.label_url,
        success: data.label_created === 1
      }
    } catch (err: any) {
      logger.error('Error in Shiprocket.generateLabel:', err?.response?.data, shipmentId)
      // console.log('Error in Shiprocket.generateLabel', err, shipmentId)
      throw err
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
      logger.error('Error in Shiprocket.cancelShipment:', err?.response?.data, awbNo)
      // console.log('Error in Shiprocket.cancelShipment', err, awbNo)
      throw err
    }
  }

  async createReturnOrder(params: ReturnOrderParams): Promise<ReturnOrderResponse> {
    try {
      const { parcel, customerAddress, storeAddress, orderDetails } = params
      const requestData: {
        order_id: string // required
        order_date: string // required
        channel_id?: number // optional
        pickup_customer_name: string // required
        pickup_last_name?: string // optional
        pickup_address: string // required
        pickup_address_2?: string // optional
        pickup_city: string // required
        pickup_state: string // required
        pickup_country: string // required
        pickup_pincode: number // required
        pickup_email: string // required
        pickup_phone: string // required
        pickup_isd_code?: string // optional
        shipping_customer_name: string // required
        shipping_last_name?: string // optional
        shipping_address: string // required
        shipping_address_2?: string // optional
        shipping_city: string // required
        shipping_country: string // required
        shipping_pincode: number // required
        shipping_state: string // required
        shipping_email?: string // optional
        shipping_isd_code?: string // optional
        shipping_phone: number // required
        order_items: Array<{
          name: string // required
          qc_enable: boolean // conditional required
          qc_product_name?: string // conditional, required if qc_enable is true
          sku: string // required
          units: number // required
          selling_price: number // required
          discount?: number // optional
          qc_brand?: string // optional
          qc_product_image?: string // conditional, required if qc_enable is true
        }>
        payment_method: 'Prepaid' // required
        total_discount?: string // optional
        sub_total: number // required
        length: number // required
        breadth: number // required
        height: number // required
        weight: number // required
      } = {
        order_id: orderDetails.orderId,
        order_date: orderDetails.orderDate,
        pickup_customer_name: customerAddress.firstName,
        pickup_last_name: customerAddress.lastName,
        pickup_address: customerAddress.address,
        pickup_city: customerAddress.city,
        pickup_state: customerAddress.state,
        pickup_country: customerAddress.country,
        pickup_pincode: customerAddress.pinCode,
        pickup_email: customerAddress.email,
        pickup_phone: '' + customerAddress.phoneNo,
        shipping_customer_name: storeAddress.firstName,
        shipping_last_name: storeAddress.lastName,
        shipping_address: storeAddress.address,
        shipping_city: storeAddress.city,
        shipping_country: storeAddress.country,
        shipping_pincode: storeAddress.pinCode,
        shipping_state: storeAddress.state,
        shipping_email: storeAddress.email,
        shipping_phone: storeAddress.phoneNo,
        order_items: orderDetails.orderItems.map((item) => ({
          name: item.name,
          qc_enable: item.qc_enable,
          sku: item.sku,
          units: item.units,
          selling_price: item.sellingPrice
        })),
        payment_method: 'Prepaid',
        sub_total: orderDetails.subTotal,
        length: parcel.volume.width,
        breadth: parcel.volume.breadth,
        height: parcel.volume.height,
        weight: parcel.weight
      }
      const resp = await axios.post<{
        order_id: number
        shipment_id: number
        status: string
        status_code: number
        company_name: string
      }>(CREATE_RETURN_ORDER, requestData, {
        headers: { Authorization: `Bearer ${this.token}` }
      })
      const { data } = resp
      return {
        orderId: '' + data.order_id,
        shipmentId: '' + data.shipment_id,
        status: data.status,
        statusCode: '' + data.status_code
      }
    } catch (err: any) {
      logger.error('Error in Shiprocket.createReturnOrder:', err?.response?.data)
      // console.log('Error in Shiprocket.createReturnOrder', err)
      throw err
    }
  }
}

export const shipRocketTrackingActivityMapping = async (trackingActivities: ScanData[]) => {
  const systemTrackingActivities = await AppDataModel.find({ type: CONSTANTS.TYPE.TRACKING_STATUS }).lean()

  const transformedActivities = []
  for (const trackingActivity of trackingActivities) {
    const { date, activity, location, status } = trackingActivity
    const activityCode = trackingActivity['sr-status']
    let systemActivity: any = {
      date: moment.tz(date, 'YYYY-MM-DD HH:mm:ss', 'Asia/Kolkata').tz('UTC').toDate(),
      dateTime: date,
      authorType: 'logistics',
      authorName: 'Shiprocket Logistics',
      activity,
      location,
      status
    }
    if (ShipRocketToSystemActivityMapping[activityCode]) {
      systemActivity.statusCode = ShipRocketToSystemActivityMapping[activityCode]

      const systemActivityData = systemTrackingActivities.find(
        (a) => a.statusCode === systemActivity.statusCode
      )
      if (systemActivityData) {
        systemActivity.label = systemActivityData.name
      }

      transformedActivities.push(systemActivity)
    } else {
      systemActivity = { ...trackingActivity, ...systemActivity }
    }
  }

  return transformedActivities?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

// const activities = [
//   {
//     date: '2025-01-30 14:42:03',
//     status: 'DLV',
//     activity: 'Delivered',
//     location: 'BOMMANAHALLI BRANCH , BANGALORE',
//     'sr-status': 7,
//     'sr-status-label': 'DELIVERED'
//   },
//   {
//     date: '2025-01-30 11:29:16',
//     status: 'OUTDLV',
//     activity: 'Out For Delivery',
//     location: 'BOMMANAHALLI BRANCH , BANGALORE',
//     'sr-status': 17,
//     'sr-status-label': 'OUT FOR DELIVERY'
//   },
//   {
//     date: '2025-01-30 08:52:30',
//     status: 'PREPERD',
//     activity: 'FDM Prepared',
//     location: 'BOMMANAHALLI BRANCH , BANGALORE',
//     'sr-status': 'NA',
//     'sr-status-label': 'NA'
//   },
//   {
//     date: '2025-01-29 19:39:10',
//     status: 'NONDLV',
//     activity: 'Not Delivered',
//     location: 'BOMMANAHALLI BRANCH , BANGALORE',
//     'sr-status': 21,
//     'sr-status-label': 'UNDELIVERED'
//   },
//   {
//     date: '2025-01-29 19:37:32',
//     status: 'OUTDLV',
//     activity: 'Out For Delivery',
//     location: 'BOMMANAHALLI BRANCH , BANGALORE',
//     'sr-status': 17,
//     'sr-status-label': 'OUT FOR DELIVERY'
//   },
//   {
//     date: '2025-01-29 08:54:56',
//     status: 'PREPERD',
//     activity: 'FDM Prepared',
//     location: 'BOMMANAHALLI BRANCH , BANGALORE',
//     'sr-status': 'NA',
//     'sr-status-label': 'NA'
//   },
//   {
//     date: '2025-01-28 17:17:24',
//     status: 'BKD',
//     activity: 'Booked',
//     location: 'BOMMANAHALLI BRANCH , BANGALORE',
//     'sr-status': 6,
//     'sr-status-label': 'SHIPPED'
//   },
//   {
//     date: '2025-01-28 15:21:19',
//     status: 'PCUP',
//     activity: 'Picked Up',
//     location: 'BOMMANAHALLI BRANCH , BANGALORE',
//     'sr-status': 42,
//     'sr-status-label': 'PICKED UP'
//   },
//   {
//     date: '2025-01-28 10:40:17',
//     status: 'PCAW',
//     activity: 'Pickup Awaited',
//     location: 'BOMMANAHALLI BRANCH , BANGALORE',
//     'sr-status': 19,
//     'sr-status-label': 'OUT FOR PICKUP'
//   },
//   {
//     date: '2025-01-28 10:40:17',
//     status: 'PCSC',
//     activity: 'Pickup Scheduled',
//     location: 'BOMMANAHALLI BRANCH , BANGALORE',
//     'sr-status': 'NA',
//     'sr-status-label': 'NA'
//   },
//   {
//     date: '2025-01-28 10:40:17',
//     status: 'SPL',
//     activity: 'Softdata Upload',
//     location: 'BOMMANAHALLI BRANCH , BANGALORE',
//     'sr-status': 'NA',
//     'sr-status-label': 'NA'
//   },
//   {
//     date: '2025-01-28 10:32:46',
//     status: null,
//     activity: null,
//     location: null,
//     'sr-status': 'NA',
//     'sr-status-label': 'NA'
//   },
//   {
//     date: '2025-01-28 06:21:09',
//     status: null,
//     activity: null,
//     location: null,
//     'sr-status': 'NA',
//     'sr-status-label': 'NA'
//   },
//   {
//     date: '2025-01-27 16:01:00',
//     status: '9',
//     activity: 'Pickup Not Done',
//     location: 'RTO/CHD, BANGALORE, KARNATAKA',
//     'sr-status': 'NA',
//     'sr-status-label': 'NA',
//     latitude: '12.9119213',
//     longitude: '77.6244219'
//   },
//   {
//     date: '2025-01-27 13:46:00',
//     status: 'OFP',
//     activity: 'Out For Pickup',
//     location: 'RTO/CHD, BANGALORE, KARNATAKA',
//     'sr-status': '19',
//     'sr-status-label': 'OUT FOR PICKUP'
//   },
//   {
//     date: '2025-01-25 18:00:00',
//     status: 'DRC',
//     activity: 'Data Received',
//     location: 'RTO/CHD, BANGALORE, KARNATAKA',
//     'sr-status': 'NA',
//     'sr-status-label': 'NA'
//   }
// ]
