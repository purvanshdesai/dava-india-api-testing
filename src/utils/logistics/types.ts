export interface Parcel {
  weight: number
  volume: {
    height: number
    width: number
    breadth: number
  }
  sourcePostalCode: string
  sourceLatlng?: { lat: number; lng: number }
  destinationPostalCode: string
  destinationLatlng?: { lat: number; lng: number }
}

export interface CourierPartner {
  name: string
  id: string
  isHyperlocal: boolean
  qcCheck: boolean
}

export interface CourierServiceabilityParams {
  // shiprocket
  parcel?: Parcel
  orderId?: number
  qcCheck?: boolean
  hyperlocal?: boolean
  isReturn?: boolean
  declaredValue?: number
  //swiggy
  partnerOrderId?: string
  pickupLat?: number
  pickupLng?: number
  dropLat?: number
  dropLng?: number
}

export interface QuickCourierServiceabilityParams {
  pickupPostcode: string
  latFrom: number
  longFrom: number
  deliveryPostcode: string
  latTo: number
  longTo: number
  isNewHyperLocal: Number
}

export interface QuickCourierServiceabilityResponse {
  id: string
  name: string
  charges: number
  etdHours?: number
  etd?: string
  etdDays?: number
}

export interface CourierServiceabilityResponse {
  id: string
  name: string
  isHyperlocal: boolean
  charges: number
  etdHours: number
  etd: string
  etdDays: number
}

export interface OrderItem {
  name: string
  sku: string
  units: number
  sellingPrice: number
}
export interface DeliveryDetails {
  firstName: string
  lastName: string
  address: string
  city: string
  pinCode: number
  state: string
  country: string
  email: string
  phoneNo: number
}
export interface OrderDetails {
  systemOrderId: string
  orderId: string
  orderDate: string
  pickupLocation: string
  deliveryDetails: DeliveryDetails
  orderItems: OrderItem[]
  subTotal: number
}
export interface CreateOrderParams {
  parcel: Parcel
  orderDetails: OrderDetails
  deliveryCoordinates?: any
}
export interface CreateOrderResponse {
  partnerOrderId: string
  orderId?: string
  shipmentId: number
  status: string
  statusCode: number
}
export interface GenerateAWBParams {
  shipmentId: number
  courierId?: number
  isReturn?: boolean
}

export interface GenerateAWBResponse {
  awbNo: string
}

export interface SchedulePickupParams {
  shipmentId: number
  status?: 'retry'
  pickupDate?: string[]
}

export interface ReSchedulePickupParams {
  shipmentId: number | string
}

export interface AddStorePickupLocationParams {
  locationName: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  pinCode: string
}

export interface AddStorePickupLocationResponse {
  pickupLocationId: string
}

export interface SchedulePickupResponse {
  pickupDate: string
  pickupTokenNo: string
  extraData: Record<string, any>
}

export interface ShipmentTrackingResponse {
  shipmentId: string
  partnerOrderId: string
  activities: any[]
  trackingUrl: string
  estimatedTimeOfDelivery: string
  courierName: string
  currentStatus: string
}

export interface GenerateManifestParams {
  shipmentId: string
}

export interface GenerateManifestResponse {
  success: boolean
  manifestUrl: string
}

export interface GenerateLabelParams {
  shipmentId: string
}

export interface GenerateLabelResponse {
  success: boolean
  labelUrl: string
}

export interface CancelShipmentParams {
  awbNo: string
}

export interface CancelShipmentResponse {
  message: string
}

export interface ReturnOrderItem extends OrderItem {
  qc_enable: boolean
  qc_product_name?: string // Optional property
}

export interface ReturnOrderDetails {
  orderId: string
  orderDate: string
  orderItems: ReturnOrderItem[]
  subTotal: number
}

export interface ReturnOrderParams {
  customerAddress: DeliveryDetails
  storeAddress: DeliveryDetails
  parcel: Parcel
  orderDetails: ReturnOrderDetails
}

export interface ReturnOrderResponse {
  orderId: string
  shipmentId: string
  status: string
  statusCode: string
}

export interface SyncTrackingParams {
  orderId: string
  awbNo: string
  existingTimeline?: Array<any>
}

export type ScanData = {
  date: string
  status: string
  activity: string
  location: string
  'sr-status': string
  'sr-status-label': string
  latitude?: string
  longitude?: string
}

// Swiggy

type SwiggyAddress = {
  type?: string
  referenceId?: string
  lat: number
  lng: number
  name: string
  mobile: string
  mobilePin?: number
  address: string
  city: string
  landmark: string
}

export type SwiggyPlaceOrderRequest = {
  partnerId: string
  merchantId: string
  partnerOrderId: string
  pickupAddress: SwiggyAddress
  dropAddress: SwiggyAddress
  packageDetails: {
    type: string
    details: string
    totalValue: number
  }
  amountToCollect: number
  otps: {
    pickUpOtp: string
    dropOffOtp: string
    rtoOtp: string
  }
}

export type SwiggyPlaceOrderResponse = {
  orderId: string
  status: string
}

export type SwiggyCancelOrderRequest = {
  partnerId: string
  merchantId: string
  cancellationReason: string
}

export type SwiggyCancelOrderResponse = {
  cancelled: boolean
  cancellationTimestamp: number
}

export type SwiggyTrackOrderRequest = {
  partnerId: string
  merchantId: string
}

export type SwiggyTrackOrderResponse = {
  orderId: string
  partnerOrderId: string
  status: string
  eventTimestamp: number
  deInfo: {
    name: string
    mobile: string
    mobilePin: number
    location: {
      lat: number
      lng: number
    }
    etaInMinutes: number
  }
  cancellationInfo: {
    cancelledBy: string
    reason: string
    cancelledAt: number
  }
  returnInfo: {
    status: string
    deInfo: {
      name: string
      mobile: string
      mobilePin: number
      location: {
        lat: number
        lng: number
      }
      etaInMinutes: number
    }
  }
}

export type SwiggyOrderEstimateRequest = {
  partnerId: string
  merchantId: string
  partnerOrderId: string
  pickupLat: number
  pickupLng: number
  dropLat: number
  dropLng: number
}

export type SwiggyOrderEstimateResponse = {
  statusCode: number
  statusMessage: string
  body: {
    serviceabilityResult: {
      status: string
      reason: string
    }
    lastMileDistanceMeters: number
    slaMaxMinutes: number
  }
}

//written for quickcourier
// Define TypeScript interfaces for request and response
export type PickupAddressParams = {
  pickupLocation: string
  name: string
  email: string
  phone: string
  address: string
  address2?: string
  city: string
  state: string
  country: string
  pinCode: string
  lat?: string
  long?: string
  isHyperlocal?: number
}

export type PickupAddressResponse = {
  success: boolean
  company_name: string
  full_name: string
  pickup_id: number
  address: {
    company_id: number
    pickup_code: string
    address: string
    address_2: string
    city: string
    state: string
    country: string
    pin_code: string
    phone: string
    email: string
    name: string
    lat: string
    long: string
    status: number
    created_at: string
    updated_at: string
    id: number
  }
}

export type QuickOrderItem = {
  name: string
  sku: string
  units: number
  selling_price: string
  hsn: number
}

export type PickupAddress = {
  pickup_location: string
  city: string
  state: string
  country: string
  pin_code: string
  address: string
  address_2?: string
  name: string
  email: string
  lat: number
  long: number
  phone: string
}

export type QuickCreateOrderParams = {
  order_id: string
  order_date: string
  pickup_location?: string
  pickup_address?: PickupAddress
  billing_customer_name: string
  billing_last_name: string
  billing_address: string
  billing_address_2?: string
  billing_city: string
  billing_pincode: string
  billing_state: string
  billing_country: string
  billing_email: string
  billing_phone: string
  latitude: number
  longitude: number
  shipping_is_billing: boolean
  shipping_customer_name?: string
  shipping_last_name?: string
  shipping_address?: string
  shipping_address_2?: string
  shipping_city?: string
  shipping_pincode?: string
  shipping_country?: string
  shipping_state?: string
  shipping_email?: string
  shipping_phone?: string
  order_items: QuickOrderItem[]
  payment_method: string
  sub_total: number
  length: number
  breadth: number
  height: number
  weight: number
  shipping_method: string
  search_rider_for?: number
  drop_otp?: number
  rto_otp?: number
  collect_shipping_fees?: boolean
}

export type QuickCreateOrderResponse = {
  order_id: number
  shipment_id: number
  status: string
  status_code: number
}

export type AssignAWBParams = {
  shipment_id: string
  courier_id?: string
}

export type AssignAWBResponse = {
  success: boolean
  message: string
  awb_code: string
}
export type CancelOrderParams = {
  ids?: number[] // Shiprocket order IDs
  awb_codes?: string[] // AWB codes
  channel_order_ids?: string[] // Channel order IDs
}

export type CancelOrderResponse = {
  success: boolean
  message: string
}
