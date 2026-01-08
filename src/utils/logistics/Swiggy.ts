import { CourierAggregator } from './CourierAggregator'
import {
  SwiggyPlaceOrderRequest,
  SwiggyPlaceOrderResponse,
  SwiggyCancelOrderRequest,
  SwiggyCancelOrderResponse,
  SwiggyTrackOrderRequest,
  SwiggyTrackOrderResponse,
  SwiggyOrderEstimateResponse
} from './types'
import axios from '../axios'
import { OrderModel } from '../../services/order/order.schema'

const CHECK_ESTIMATE_PATH = '/api/v1/order/estimate' // GET
const TRACK_ORDER_PATH = '/api/v1/order/{orderId}/status' // GET
const PLACE_ORDER_PATH = '/api/v1/order' // POST
const CANCEL_ORDER_PATH = '/api/v1/cancel/order/{orderId}' // PATCH

interface SwiggyConfig {
  partnerId: string
  merchantId: string
  token: string
  host: string
}

export class Swiggy implements CourierAggregator {
  config: SwiggyConfig

  constructor(config: SwiggyConfig) {
    this.config = config
  }

  async getAuthorization(): Promise<any> {
    try {
      return null
    } catch (err) {
      console.log('Error in Shiprocket.getAuthorization')
      throw err
    }
  }

  async courierServiceability(params: any): Promise<any> {
    try {
      const requestData: any = {
        partnerId: this.config.partnerId,
        merchantId: this.config.merchantId,
        partnerOrderId: params?.partnerOrderId,
        pickupLat: params?.pickupLat,
        pickupLng: params?.pickupLng,
        dropLat: params?.dropLat,
        dropLng: params?.dropLng
      }

      const queryString = new URLSearchParams(requestData).toString()

      const URL = `${this.config.host}${CHECK_ESTIMATE_PATH}?${queryString}`

      const { data } = await axios.get<SwiggyOrderEstimateResponse>(URL, {
        headers: { Authorization: `Bearer ${this.config.token}` }
      })

      return data?.body || {}
    } catch (err) {
      console.log('Error in Swiggy Track order')
      throw err
    }
  }

  async createOrder(orderDetails: any): Promise<any> {
    try {
      const requestData: SwiggyPlaceOrderRequest = {
        partnerId: `${this.config.partnerId}`,
        merchantId: `${this.config.merchantId}`,
        ...orderDetails
        // partnerOrderId: orderDetails?._id,
        // pickupAddress: {
        //   type: 'STORE',
        //   referenceId: '123456',
        //   lat: 19.105264636159944,
        //   lng: 72.88214570100811,
        //   name: 'Mano',
        //   mobile: '+91-9442321830',
        //   mobilePin: 123456,
        //   address: 'Flat ABC, Apartment XYZ, Street LMN, Area RST',
        //   city: 'Bengaluru',
        //   landmark: 'Orion Mall'
        // },
        // dropAddress: {
        //   lat: 19.105264636159944,
        //   lng: 72.88214570100811,
        //   name: 'Mukesh',
        //   mobile: '+91-8870490623',
        //   address: 'Flat ABC, Apartment XYZ, Street LMN, AreaRST',
        //   city: 'city XYZ',
        //   landmark: 'Landmark OPQ'
        // },
        // packageDetails: {
        //   type: 'medicine',
        //   details: 'Dolo-650 tablets-10, Sinarest tablets-5',
        //   totalValue: 300.0
        // },
        // amountToCollect: 0,
        // otps: {
        //   pickUpOtp: '1234',
        //   dropOffOtp: '4357',
        //   rtoOtp: '6789'
        // }
      }

      console.log('Swiggy Order payload ==>', requestData)

      const URL = `${this.config.host}${PLACE_ORDER_PATH}`

      const { data }: any = await axios.post<SwiggyPlaceOrderResponse>(URL, requestData, {
        headers: { Authorization: `Bearer ${this.config.token}` }
      })
      console.log(data)

      if (!data?.body) throw new Error(data?.statusMessage)

      return data?.body || {}
    } catch (err) {
      console.log('Error in SWIGGY Place order', err)
      throw err
    }
  }

  async cancelOrder(swiggyOrderId: string, opts: any): Promise<any> {
    try {
      const { cancellationReason } = opts

      const requestData: SwiggyCancelOrderRequest = {
        partnerId: `${this.config.partnerId}`,
        merchantId: `${this.config.merchantId}`,
        cancellationReason: cancellationReason ?? 'cancelled'
      }

      const URL = `${this.config.host}${CANCEL_ORDER_PATH.replace('{orderId}', swiggyOrderId)}`

      const resp = await axios.post<SwiggyCancelOrderResponse>(URL, requestData, {
        headers: { Authorization: `Bearer ${this.config.token}` }
      })

      console.log('Swiggy cancel order response ==>', resp?.data)

      return resp.data
    } catch (err) {
      console.log('Error in SWIGGY Cancel order')
      throw err
    }
  }

  async getTrackingData(swiggyOrderId: string): Promise<any> {
    try {
      const requestData: SwiggyTrackOrderRequest = {
        partnerId: this.config.partnerId,
        merchantId: this.config.merchantId
      }

      const URL = `${this.config.host}${TRACK_ORDER_PATH.replace('{orderId}', swiggyOrderId)}?merchantId=${requestData?.merchantId}&partnerId=${requestData?.partnerId}`

      const resp = await axios.get<SwiggyTrackOrderResponse>(URL, {
        headers: { Authorization: `Bearer ${this.config.token}` }
      })
      return resp.data
    } catch (err) {
      console.log('Error in Swiggy Track order')
      throw err
    }
  }
}
