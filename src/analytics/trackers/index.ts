import { trackEvent } from '../index'
import { SERVER_EVENTS } from '../events'
import {
  OrderShippedProps,
  OrderDeliveredProps,
  OrderCancelledProps,
  RefundProcessedProps,
  ReturnProcessedProps,
  SupportTicketCreatedProps,
  SupportTicketClosedProps,
  MedicineRemainderProps
} from '../properties'

export async function trackOrderShipped(payload: OrderShippedProps) {
  await trackEvent(SERVER_EVENTS.ORDER_SHIPPED, payload)
}

export async function trackOrderDelivered(payload: OrderDeliveredProps) {
  await trackEvent(SERVER_EVENTS.ORDER_DELIVERED, payload)
}

export async function trackOrderCancelled(payload: OrderCancelledProps) {
  await trackEvent(SERVER_EVENTS.ORDER_CANCELLED, payload)
}

export async function trackRefundProcessed(payload: RefundProcessedProps) {
  await trackEvent(SERVER_EVENTS.REFUND_PROCESSED, payload)
}

export async function trackReturnProcessed(payload: ReturnProcessedProps) {
  await trackEvent(SERVER_EVENTS.RETURN_PROCESSED, payload)
}

export async function trackSupportTicketCreated(payload: SupportTicketCreatedProps) {
  await trackEvent(SERVER_EVENTS.SUPPORT_TICKET_CREATED, payload)
}

export async function trackSupportTicketClosed(payload: SupportTicketClosedProps) {
  await trackEvent(SERVER_EVENTS.SUPPORT_TICKET_CLOSED, payload)
}

export async function trackMedicineRemainder(payload: MedicineRemainderProps) {
  await trackEvent(SERVER_EVENTS.MEDICINE_REMAINDER, payload)
}
