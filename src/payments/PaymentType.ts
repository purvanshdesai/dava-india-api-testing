export type TOrderDetails = {
  paymentAmount: number
  currency: string
  userSocketId: string
  paymentType: string
  userId: string
  orderId: string
  couponCode?: string
  productInfo?: string
  email?: string
  customerName?: string
  phone?: string
  paymentFor?: string
  deviceType?: string
}

export abstract class PaymentGateway {
  abstract initOrder(orderData: TOrderDetails): Promise<any>
  abstract refundPayment(transactionId: string, amount: number, opts?: any): Promise<void>

  // Optional shared method
  amountFormatter(amount: number): number {
    return Math.round(amount * 100)
  }
}

export type PaymentResponse = {
  orderId: string
  paymentOrderId?: string
  status: string
  transactionId?: string
  refundId?: string
  paymentFor: string
  couponCode?: string
  userSocketId?: string
  orderItemId?: string
  orderItemsId?: string
  type?: string
  amount?: string | number
  currency?: string
  payment_id?: string
  id?: string
  isPartialCancel?: boolean
  paymentStatus?: string
}
