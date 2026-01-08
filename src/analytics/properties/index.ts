import { SERVER_EVENT_PROPERTY_KEYS } from '../constants/propertyKeys'
import { SERVER_EVENTS } from '../events'
import { ALL } from '../constants/providerNames'

export type OrderShippedProps = {
  [SERVER_EVENT_PROPERTY_KEYS.USER_ID]: string
  [SERVER_EVENT_PROPERTY_KEYS.ORDER_ID]: string
  [SERVER_EVENT_PROPERTY_KEYS.DATE_OF_ORDER]: string
  [SERVER_EVENT_PROPERTY_KEYS.SHIPMENT_MODE]: string
  [SERVER_EVENT_PROPERTY_KEYS.SHIPPING_ADDRESS]: string
  [SERVER_EVENT_PROPERTY_KEYS.DATE_OF_DELIVERY]: string
}

export type OrderDeliveredProps = {
  [SERVER_EVENT_PROPERTY_KEYS.USER_ID]: string
  [SERVER_EVENT_PROPERTY_KEYS.ORDER_ID]: string
  [SERVER_EVENT_PROPERTY_KEYS.DATE_OF_DELIVERY]: string
}

export type OrderCancelledProps = {
  [SERVER_EVENT_PROPERTY_KEYS.USER_ID]: string
  [SERVER_EVENT_PROPERTY_KEYS.ORDER_ID]: string
  [SERVER_EVENT_PROPERTY_KEYS.DATE_OF_ORDER]: string
  [SERVER_EVENT_PROPERTY_KEYS.CUSTOMER_NAME]: string
  [SERVER_EVENT_PROPERTY_KEYS.EMAIL]: string
  [SERVER_EVENT_PROPERTY_KEYS.CANCELLATION_REASON]: string
}

export type RefundProcessedProps = {
  [SERVER_EVENT_PROPERTY_KEYS.USER_ID]: string
  [SERVER_EVENT_PROPERTY_KEYS.ORDER_ID]: string
  [SERVER_EVENT_PROPERTY_KEYS.REFUND_AMOUNT]: string
  [SERVER_EVENT_PROPERTY_KEYS.REFUND_METHOD]: string
  [SERVER_EVENT_PROPERTY_KEYS.REFUND_STATUS]: string
}

export type SupportTicketCreatedProps = {
  [SERVER_EVENT_PROPERTY_KEYS.USER_ID]: string
  [SERVER_EVENT_PROPERTY_KEYS.TICKET_ID]: string
  [SERVER_EVENT_PROPERTY_KEYS.ISSUE_TYPE]: string
}

export type SupportTicketClosedProps = {
  [SERVER_EVENT_PROPERTY_KEYS.USER_ID]: string
  [SERVER_EVENT_PROPERTY_KEYS.TICKET_ID]: string
  [SERVER_EVENT_PROPERTY_KEYS.TICKET_RESOLUTION_TIME]: string
}

export type MedicineRemainderProps = {
  [SERVER_EVENT_PROPERTY_KEYS.USER_ID]: string
  [SERVER_EVENT_PROPERTY_KEYS.PRODUCT_ID]: string
  [SERVER_EVENT_PROPERTY_KEYS.PINCODE]: string
}

export type ReturnProcessedProps = {
  [SERVER_EVENT_PROPERTY_KEYS.USER_ID]: string
  [SERVER_EVENT_PROPERTY_KEYS.ORDER_ID]: string
  [SERVER_EVENT_PROPERTY_KEYS.PRODUCT_ID]: string
}

export const EVENT_PROVIDER_PAYLOADS = {
  [SERVER_EVENTS.ORDER_SHIPPED]: {
    [ALL]: (data: OrderShippedProps) => ({
      userId: data.userId,
      orderId: data.orderId,
      dateOfOrder: data.dateOfOrder,
      shipmentMode: data.shipmentMode,
      shippingAddress: data.shippingAddress,
      dateOfDelivery: data.dateOfDelivery
    })
  },
  [SERVER_EVENTS.ORDER_DELIVERED]: {
    [ALL]: (data: OrderDeliveredProps) => ({
      userId: data.userId,
      orderId: data.orderId,
      dateOfDelivery: data.dateOfDelivery
    })
  },
  [SERVER_EVENTS.ORDER_CANCELLED]: {
    [ALL]: (data: OrderCancelledProps) => ({
      userId: data.userId,
      orderId: data.orderId,
      dateOfOrder: data.dateOfOrder,
      customerName: data.customerName,
      email: data.email,
      cancellationReason: data.cancellationReason
    })
  },
  [SERVER_EVENTS.REFUND_PROCESSED]: {
    [ALL]: (data: RefundProcessedProps) => ({
      userId: data.userId,
      orderId: data.orderId,
      refundAmount: data.refundAmount,
      refundMethod: data.refundMethod,
      refundStatus: data.refundStatus
    })
  },
  [SERVER_EVENTS.RETURN_PROCESSED]: {
    [ALL]: (data: ReturnProcessedProps) => ({
      userId: data.userId,
      orderId: data.orderId,
      productId: data.productId
    })
  },
  [SERVER_EVENTS.SUPPORT_TICKET_CREATED]: {
    [ALL]: (data: SupportTicketCreatedProps) => ({
      userId: data.userId,
      ticketId: data.ticketId,
      issueType: data.issueType
    })
  },
  [SERVER_EVENTS.SUPPORT_TICKET_CLOSED]: {
    [ALL]: (data: SupportTicketClosedProps) => ({
      userId: data.userId,
      ticketId: data.ticketId,
      ticketResolutionTime: data.ticketResolutionTime
    })
  }
}
