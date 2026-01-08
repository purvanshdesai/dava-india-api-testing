import {
  CancelShipmentParams,
  CancelShipmentResponse,
  CourierServiceabilityParams,
  CourierServiceabilityResponse,
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
  SyncTrackingParams,
  QuickCourierServiceabilityParams,
  QuickCourierServiceabilityResponse,
  QuickCreateOrderParams,
  QuickCreateOrderResponse,
  CancelOrderParams,
  CancelOrderResponse,
  AssignAWBParams,
  AssignAWBResponse,
  PickupAddressParams,
  PickupAddressResponse
} from './types'

export interface CourierAggregator {
  /**
   * Get the authorization details for the courier aggregator.
   */
  getAuthorization?(): Promise<any>

  /**
   * Get a list of available couriers.
   */
  listOfCouriers?(): Promise<any[]>

  listOfSupportedCouriers?(): Promise<any[]>

  /**
   * Check the serviceability of a courier based on criteria.
   * @param criteria Criteria to check serviceability.
   */
  courierServiceability?(criteria: CourierServiceabilityParams | QuickCourierServiceabilityParams): Promise<CourierServiceabilityResponse[] | QuickCourierServiceabilityResponse[]>

  /**
   * Create an order in the courier system.
   * @param orderDetails Details of the order to be created.
   */
  createOrder?(orderDetails: any | QuickCreateOrderParams): Promise<any | QuickCreateOrderResponse>

  /**
   * Cancel an order before shipping.
   * @param orderId The ID of the order to cancel.
   */
  cancelOrder?(orderId: string | CancelOrderParams, opts?: any): Promise<boolean | CancelOrderResponse>

  /**
   * Generate an AWB (Air Waybill) for the order.
   * @param params The ID of the order for which to generate an AWB.
   */
  generateAWB?(params: GenerateAWBParams | AssignAWBParams): Promise<GenerateAWBResponse | AssignAWBResponse>

  /**
   * Get tracking data for a specific tracking ID.
   * @param trackingId The tracking ID for which to retrieve data.
   */
  getTrackingData?(trackingId: string): Promise<any>

  /**
   * Synchronize tracking data for a specific order.
   * @param orderId The ID of the order for which to sync tracking data.
   */
  syncTrackingData?(params?: SyncTrackingParams): Promise<any>

  schedulePickup?(params: SchedulePickupParams): Promise<SchedulePickupResponse>

  reSchedulePickup?(params: ReSchedulePickupParams): Promise<SchedulePickupResponse>

  addStorePickupLocation?(params: any | PickupAddressParams): Promise<any | PickupAddressResponse>

  generateManifest?(params: GenerateManifestParams): Promise<GenerateManifestResponse>

  generateLabel?(params: GenerateLabelParams): Promise<GenerateLabelResponse>

  cancelShipment?(params: CancelShipmentParams): Promise<CancelShipmentResponse>

  createReturnOrder?(params: ReturnOrderParams): Promise<ReturnOrderResponse>
}
