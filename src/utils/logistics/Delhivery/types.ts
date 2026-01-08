export type DelhiveryEnv = 'staging' | 'prod'

export interface DelhiveryClientOptions {
  token: string
  env?: DelhiveryEnv // default 'staging'
  timeoutMs?: number // default 30000
  baseUrlOverride?: string // rarely needed
}

/* -------------------------- Shared model types --------------------------- */

export interface ApiError {
  success?: boolean
  error?: string
  message?: string
  [k: string]: unknown
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonValue[]
  | { [k: string]: JsonValue }

export type FormEncodable = Record<string, JsonValue>

/* ---------------------- (1) Serviceability / TAT ------------------------- */

export interface ServiceabilityPin {
  pin: string
  // Commonly returned flags (field names can vary slightly by account)
  is_oda?: boolean
  prepaid?: 'Y' | 'N'
  cod?: 'Y' | 'N'
  reverse?: 'Y' | 'N'
  pickup?: 'Y' | 'N'
  serviceable?: 'Y' | 'N'
  // Sometimes ETA/TAT-related fields appear (treat as optional)
  tat?: string | number // e.g., days or hours
  edd?: string // estimated delivery date
  [k: string]: JsonValue
}

export interface ServiceabilityResponse {
  delivery_codes?: Array<{
    postal_code: ServiceabilityPin
    // sometimes additional grouping fields present
    [k: string]: JsonValue
  }>
  // Some accounts return a simpler array
  postal_codes?: ServiceabilityPin[]
  [k: string]: JsonValue
}

export interface ServiceabilityTATResponse {
  success: boolean
  data: {
    tat: number
  }
  msg: string
}

export interface ServiceabilityReturnResponse {
  id: string
  name: string
  charges: number
  etdHours?: number
  etd?: string
  etdDays?: number
}

/* -------------------------- (2) Create Shipment -------------------------- */

export type PaymentMode = 'Prepaid' | 'COD'

export interface ShipmentItem {
  name?: string // optional product name
  sku?: string // optional SKU
  qty?: number
  price?: number
  [k: string]: JsonValue
}

export interface ShipmentCreate {
  // Consignee (customer) details
  name: string
  add: string // street address
  city: string
  state: string
  country: string // "India"
  pin: string // destination pincode
  phone: string

  // Order/shipment info
  order: string // your order id
  payment_mode: PaymentMode
  products_desc?: string
  total_amount?: number
  cod_amount?: number // required if payment_mode === "COD"
  quantity?: number
  weight?: number // in kg
  length?: number // in cm
  breadth?: number // in cm
  height?: number // in cm
  waybill?: string // optional: let Delhivery auto-assign for single-piece
  return_name?: string
  return_add?: string
  return_city?: string
  return_state?: string
  return_country?: string
  return_pin?: string
  return_phone?: string

  // Optional itemized lines
  items?: ShipmentItem[]

  // Anything else your account supports
  [k: string]: JsonValue
}

export interface CreateShipmentPayload {
  pickup_location: {
    name: string // Delhivery-registered pickup code/name
  }
  shipments: ShipmentCreate[] // one or more shipments
  [k: string]: JsonValue
}

export interface CreateShipmentResult {
  success?: boolean
  status?: string
  package_count?: number
  waybill?: string // commonly returned for single-piece auto-allocation
  packages?: Array<{
    waybill?: string
    refnum?: string
    status?: string
    remarks?: string
    [k: string]: JsonValue
  }>
  [k: string]: JsonValue
}

/* ----------------------- (3) Cancel & (4) Edit/Update -------------------- */

export interface EditShipmentPayload {
  shipment: {
    waybill?: string
    order?: string
    cancellation?: 'true' | 'false'
    // Editable fields (examples)
    name?: string
    add?: string
    city?: string
    state?: string
    country?: string
    pin?: string
    phone?: string
    products_desc?: string
    total_amount?: number
    cod_amount?: number
    // etc…
    [k: string]: JsonValue
  }
}

export interface EditShipmentResult {
  success?: boolean
  status?: string
  remarks?: string
  [k: string]: JsonValue
}

/* --------------------------- (5) Tracking Pull --------------------------- */

export interface TrackingScan {
  time?: string // ISO or timestamp
  location?: string
  status?: string
  instructions?: string
  [k: string]: JsonValue
}

export interface TrackingPackage {
  waybill?: string
  refnum?: string
  status?: string
  scans?: TrackingScan[]
  current_status?: string
  // sometimes additional fields: package_history, origin, destination, etc.
  [k: string]: JsonValue
}

export interface TrackingResponse {
  ShipmentData?: Array<{
    Shipment?: TrackingPackage
    [k: string]: JsonValue
  }>
  // Some accounts respond with a flatter structure:
  packages?: TrackingPackage[]
  [k: string]: JsonValue
}

/* ----------------------- (6) Pickup Request Creation --------------------- */

export interface PickupRequestPayload {
  phone: string
  city?: string
  name: string
  pin: string
  address?: string
  country?: string
  email?: string
  registered_name?: string
  return_address: string
  return_pin?: string
  return_city?: string
  return_state?: string
  return_country?: string
  // sometimes additional fields: package_history, origin, destination, etc.
  [k: string]: JsonValue
}

interface PickupSuccessResponse {
  name: string
  pincode: number
  [k: string]: JsonValue
}

export interface PickupRequestResult {
  success: boolean
  error: string // aka PUR
  data: PickupSuccessResponse
  [k: string]: JsonValue
}

/* ------------------- (7) Shipping Label / Packing Slip ------------------- */

export interface PackingSlipParams {
  waybill?: string
  order?: string // aka ref_ids
}

export interface PackingSlipResponse {
  success?: boolean
  slips?: Array<{
    waybill?: string
    barcode?: string // content for Code-128
    consignee?: {
      name?: string
      add?: string
      city?: string
      state?: string
      pin?: string
      phone?: string
      [k: string]: JsonValue
    }
    origin?: string
    destination?: string
    // plus other fields you can render on your label
    [k: string]: JsonValue
  }>
  [k: string]: JsonValue
}

export interface SchedulePickupParams {
  pickup_time: string
  pickup_date: string
  pickup_location: string
  expected_package_count: number
}

export interface SchedulePickUpResponse {
  success?: boolean
  pickup_location_name: string
  client_name: string
  pickup_time: string
  pickup_id: number
  incoming_center_name: string
  expected_package_count: number
  pickup_date: string
  error?: any
  pickupScheduledAt?: string | null
}

export interface GenerateLabelParams {
  waybill: string
  pdf?: boolean
  pdf_size?: string
}
