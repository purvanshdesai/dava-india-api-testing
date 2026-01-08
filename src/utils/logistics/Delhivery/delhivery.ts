// delhivery.ts
// import axios, { AxiosInstance } from 'axios'
import {
  DelhiveryClientOptions,
  FormEncodable,
  ServiceabilityResponse,
  CreateShipmentPayload,
  CreateShipmentResult,
  EditShipmentPayload,
  EditShipmentResult,
  TrackingResponse,
  PickupRequestResult,
  PickupRequestPayload,
  ServiceabilityReturnResponse,
  ServiceabilityTATResponse,
  SchedulePickupParams,
  SchedulePickUpResponse,
  GenerateLabelParams
} from './types'
import moment from 'moment'
import axios from '../../axios'

/* ------------------------------- Client ---------------------------------- */

export class DelhiveryClient {
  private token: string
  private baseURL: string
  private timeout: number

  constructor(opts: DelhiveryClientOptions) {
    const env = opts.env ?? 'staging'
    this.timeout = opts.timeoutMs ?? 30000
    this.baseURL =
      opts.baseUrlOverride ??
      (env === 'prod' ? 'https://track.delhivery.com' : 'https://staging-express.delhivery.com')

    this.token = opts.token

    // this.axios = axios.create({
    //   baseURL,
    //   timeout,
    //   headers: {
    //     Accept: 'application/json',
    //     Authorization: `Token ${this.token}`
    //   }
    // })
  }

  /* Utility: encode the special Delhivery form format */
  private toForm(data: FormEncodable): string {
    const form = new URLSearchParams()
    form.set('format', 'json')
    form.set('data', JSON.stringify(data))
    return form.toString()
  }

  private getAxiosProps() {
    return {
      timeout: this.timeout,
      headers: {
        Accept: 'application/json',
        Authorization: `Token ${this.token}`
      }
    }
  }

  /* ---------------------------------- 1 ---------------------------------- */
  /**
   * Check B2C pincode serviceability + (where available) TAT/EDD hints.
   * Note: this endpoint expects the token in the query params.
   */
  async courierServiceability(params: {
    originPin: string
    destinationPin: string
    fetchTat?: boolean
  }): Promise<ServiceabilityReturnResponse[]> {
    try {
      const { data } = await axios.get<ServiceabilityResponse>(`${this.baseURL}/c/api/pin-codes/json/`, {
        ...this.getAxiosProps(),
        params: { token: this.token, filter_codes: params?.destinationPin }
      })
      const { delivery_codes } = data

      if (!delivery_codes?.length) throw new Error('No center available for this pincode!')

      const deliverableCodes = (delivery_codes ?? []).reduce(
        (acc: ServiceabilityReturnResponse[], d: any) => {
          const { postal_code: pc } = d

          if (pc.pickup !== 'Y') return acc

          acc.push({
            id: `delhivery-tracking`,
            name: 'Delhivery Tracking',
            charges: pc.max_amount,
            etdHours: 0,
            etd: '',
            etdDays: 0
          })

          return acc
        },
        []
      )

      if (!params?.fetchTat) return deliverableCodes

      return await Promise.all(
        deliverableCodes.map(async (d) => {
          const tat = await this.checkExpectedTAT(params)

          const cost = await this.calculateShippingCost(params)

          return {
            ...d,
            etdDays: tat,
            etd: moment()
              .add(tat ?? 0, 'days')
              .format('YYYY-MM-DD'),
            charges: cost
          }
        })
      )
    } catch (err) {
      throw err
    }
  }

  async checkExpectedTAT(params: { originPin: string; destinationPin: string }): Promise<number> {
    try {
      const { data } = await axios.get<ServiceabilityTATResponse>(`${this.baseURL}/api/dc/expected_tat`, {
        ...this.getAxiosProps(),
        params: {
          origin_pin: params.originPin,
          destination_pin: params.destinationPin,
          mot: 'E'
        }
      })

      if (!data?.success) return 0

      return data?.data?.tat ?? 0
    } catch (err) {
      throw err
    }
  }

  async calculateShippingCost(params: { originPin: string; destinationPin: string }): Promise<number> {
    try {
      const { data } = await axios.get(`${this.baseURL}/api/kinko/v1/invoice/charges/.json`, {
        ...this.getAxiosProps(),
        params: {
          md: 'E',
          cgm: 200,
          o_pin: params.originPin,
          d_pin: params.destinationPin,
          ss: 'Delivered',
          pt: 'Pre-paid'
        }
      })

      if (!data?.length) return 0

      return data[0]?.total_amount ?? 0
    } catch (err) {
      throw err
    }
  }

  /* ---------------------------------- 2 ---------------------------------- */
  /**
   * Create shipments (order manifestation). For single-piece, omit `waybill` to auto-assign.
   */
  async createOrder(
    payload: CreateShipmentPayload
  ): Promise<{ partnerOrderId: string; createPickupLocation?: boolean } | null> {
    // console.log('createOrder: ', payload)

    try {
      const { data } = await axios.post<CreateShipmentResult>(
        `${this.baseURL}/api/cmu/create.json`,
        `format=json&data=${JSON.stringify(payload)}`,
        {
          timeout: this.timeout,
          headers: {
            Accept: 'application/json',
            Authorization: `Token ${this.token}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      console.log('Create Order Response: ', data)
      // Temp fix
      if (data?.rmk === 'ClientWarehouse matching query does not exist.')
        return { createPickupLocation: true, partnerOrderId: '' }

      if (!data.success) console.error('Order Create Error: ', data?.rmk)

      if (!data.success || !data.packages) return null

      const orderPackage = data?.packages[0]

      return { partnerOrderId: orderPackage?.waybill ?? '' }
    } catch (err: any) {
      console.log(err?.response)
      throw err
    }
  }

  /* ---------------------------------- 3 ---------------------------------- */
  /**
   * Cancel a shipment by waybill or order id (as supported by your account).
   */
  async cancelOrder(params: { waybill?: string; order?: string }): Promise<any> {
    // console.log('cancelOrder: ', params)

    try {
      const body = {
        ...(params.waybill ? { waybill: params.waybill } : {}),
        cancellation: 'true'
      }
      const { data, status } = await axios.post<EditShipmentResult>(`${this.baseURL}/api/p/edit`, body, {
        timeout: this.timeout,
        headers: {
          Accept: 'application/json',
          Authorization: `Token ${this.token}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      // console.log('Cancel Res: ', data, status)

      if (status !== 200) throw new Error('Error while cancelling Delhivery shipment!')

      return data
    } catch (err: any) {
      console.log(err?.response)
      throw err
    }
  }

  /* ---------------------------------- 4 ---------------------------------- */
  /**
   * Update/edit a shipment (e.g., address, phone, payment amounts) before pickup.
   */
  async updateShipment(
    waybill: string,
    updates: Omit<EditShipmentPayload['shipment'], 'waybill'>
  ): Promise<EditShipmentResult> {
    const body = this.toForm({
      shipment: { waybill, ...updates }
    })
    const { data } = await axios.post<EditShipmentResult>(`${this.baseURL}/api/p/edit`, body, {
      timeout: this.timeout,
      headers: {
        Accept: 'application/json',
        Authorization: `Token ${this.token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data
  }

  /* ---------------------------------- 5 ---------------------------------- */
  /**
   * Track by waybill (AWB).
   */
  async trackByWaybill(waybill: string): Promise<TrackingResponse> {
    const { data } = await axios.get<TrackingResponse>(`${this.baseURL}/api/v1/packages/json/`, {
      ...this.getAxiosProps(),
      params: { waybill }
    })
    return data
  }

  /* ---------------------------------- 6 ---------------------------------- */
  /**
   * Create a pickup request (PUR).
   */
  async addStorePickupLocation(body: PickupRequestPayload): Promise<{ pickupLocation: string | null }> {
    try {
      const { data } = await axios.post<PickupRequestResult>(
        `${this.baseURL}/api/backend/clientwarehouse/create/`,
        body,
        {
          timeout: this.timeout,
          headers: {
            Accept: 'application/json',
            Authorization: `Token ${this.token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!data?.success) return { pickupLocation: null }

      return { pickupLocation: data?.data?.name }
    } catch (err: any) {
      console.log(err?.response)
      throw err
    }
  }

  /**
   * Pickup Request Creation.
   */
  async schedulePickup(body: SchedulePickupParams): Promise<SchedulePickUpResponse> {
    try {
      const { data } = await axios.post<SchedulePickUpResponse>(`${this.baseURL}/fm/request/new/`, body, {
        timeout: this.timeout,
        headers: {
          Accept: 'application/json',
          Authorization: `Token ${this.token}`,
          'Content-Type': 'application/json'
        }
      })

      let pickupScheduledAt = null

      if (data?.pickup_date && data?.pickup_time)
        pickupScheduledAt = `${data.pickup_date} ${data.pickup_time}`

      return { ...data, pickupScheduledAt }
    } catch (err: any) {
      console.log(err?.response)
      throw err
    }
  }

  /**
   * Track by your order/reference id.
   */
  async generateLabel(params: GenerateLabelParams): Promise<{ labelUrl: string | null }> {
    try {
      const { data } = await axios.get(`${this.baseURL}/api/p/packing_slip`, {
        timeout: this.timeout,
        headers: {
          Accept: 'application/json',
          Authorization: `Token ${this.token}`
        },
        params: {
          wbns: params?.waybill,
          pdf: true,
          pdf_size: 'A4'
        }
      })

      if (!data?.packages?.length) return { labelUrl: null }

      return { labelUrl: data.packages[0]?.pdf_download_link }
    } catch (err: any) {
      console.log(err?.response)
      throw err
    }
  }
}

/* ----------------------------- Usage example -----------------------------
import { DelhiveryClient } from "./delhivery";

const delhivery = new DelhiveryClient({
  token: process.env.DELHIVERY_TOKEN!,
  env: process.env.DELHIVERY_ENV === "prod" ? "prod" : "staging",
});

// 1) Serviceability
await delhivery.checkServiceability(["560001", "110001"]);

// 2) Create Shipment
await delhivery.createShipment({
  pickup_location: "BLR_WH_1",
  shipments: [
    {
      name: "Sherlock Holmes",
      add: "221B Baker Street",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      pin: "560001",
      phone: "9999999999",
      order: "ORDER-12345",
      payment_mode: "Prepaid",
      products_desc: "Books",
      total_amount: 999,
      weight: 0.5,
      quantity: 1,
    },
  ],
});

// 3) Cancel
await delhivery.cancelShipment({ waybill: "DEL123456789" });

// 4) Update
await delhivery.updateShipment("DEL123456789", { phone: "8888888888", add: "New Address" });

// 5) Track
await delhivery.trackByWaybill("DEL123456789");

// 6) Pickup request
await delhivery.createPickup({
  pickup_date: "2025-08-13",
  pickup_time: "14:00-18:00",
  warehouse_name: "BLR_WH_1",
  quantity: 10,
});

// 7) Packing slip
await delhivery.getPackingSlip({ waybill: "DEL123456789" });
--------------------------------------------------------------------------- */
