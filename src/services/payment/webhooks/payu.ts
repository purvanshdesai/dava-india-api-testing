import { Params } from '@feathersjs/feathers'
import { appConfig } from '../../../utils/config'
import { PayUPaymentGateway } from '../../../payments/payu/PayuGateway'
import { onPaymentCaptured, onPaymentFailed } from '../../../payments/utils'
import { logger } from '../../../logger'

const payUMerchantKey = (appConfig?.payu ?? {}).merchantKey

// const failedResponse = {
//   mihpayid: '403993715533782276',
//   mode: 'UPI',
//   status: 'failure',
//   key: 'BPXnQt',
//   txnid: 'TXN_1745345063195_irdzt',
//   amount: '400.00',
//   addedon: '2025-04-22 23:34:23',
//   productinfo: 'Davaindia Medicines',
//   firstname: 'Mukesh',
//   lastname: '',
//   address1: '',
//   address2: '',
//   city: '',
//   state: '',
//   country: '',
//   zipcode: '',
//   email: 'mukesh@teampumpkin.com',
//   phone: '8870490623',
//   udf1: '',
//   udf2: '',
//   udf3: '',
//   udf4: '',
//   udf5: '',
//   udf6: '',
//   udf7: '',
//   udf8: '',
//   udf9: '',
//   udf10: '',
//   card_token: '',
//   card_no: '',
//   field0: '',
//   field1: 'anything@payu',
//   field2: '0',
//   field3: '',
//   field4: 'Mukesh',
//   field5: 'AXIWHLpGPHZqYhXUBiGS9BRPuKoTpEhPuRK',
//   field6: '',
//   field7: 'Transaction Failed at bank end',
//   field8: 'generic',
//   field9: 'Transaction Failed at bank end',
//   payment_source: 'payu',
//   PG_TYPE: 'UPI-PG',
//   error: 'E000',
//   error_Message: 'No Error',
//   net_amount_debit: '0',
//   discount: '0.00',
//   offer_key: '',
//   offer_availed: '',
//   unmappedstatus: 'userCancelled',
//   hash: 'b6bc9a702fe34021bf20a31aa350cc01a094cfa2caec16509d6fc3bd3642729b059b30bdf2a8cb5c44effe3e1f81576b0ef6c6c851b92c53247fe1cb483d831a',
//   bank_ref_no: '',
//   bank_ref_num: '',
//   bankcode: 'UPI',
//   surl: 'http://localhost:3000/payment/success',
//   curl: 'http://localhost:3000/payment/failure',
//   furl: 'http://localhost:3000/payment/failure',
//   pa_name: 'PayU'
// }

// const successResponse = {
//   mihpayid: '403993715533782264',
//   mode: 'UPI',
//   status: 'success',
//   key: 'BPXnQt',
//   txnid: 'TXN_1745344618674_7fdqty',
//   amount: '200.00',
//   addedon: '2025-04-22 23:26:58',
//   productinfo: 'Davaindia Medicines',
//   firstname: 'Mukesh',
//   lastname: '',
//   address1: '',
//   address2: '',
//   city: '',
//   state: '',
//   country: '',
//   zipcode: '',
//   email: 'mukesh@teampumpkin.com',
//   phone: '8870490623',
//   udf1: '',
//   udf2: '',
//   udf3: '',
//   udf4: '',
//   udf5: '',
//   udf6: '',
//   udf7: '',
//   udf8: '',
//   udf9: '',
//   udf10: '',
//   card_token: '',
//   card_no: '',
//   field0: '',
//   field1: 'anything@payu',
//   field2: 'TXN_1745344618674_7fdqty',
//   field3: '',
//   field4: 'Mukesh',
//   field5: 'AXIR7Lpi5W0ctfa4ByXoOwE0QWzrr6SXx5G',
//   field6: '',
//   field7: 'Transaction completed successfully',
//   field8: 'generic',
//   field9: 'Transaction completed successfully',
//   payment_source: 'payu',
//   PG_TYPE: 'UPI-PG',
//   error: 'E000',
//   error_Message: 'No Error',
//   net_amount_debit: '200',
//   discount: '0.00',
//   offer_key: '',
//   offer_availed: '',
//   unmappedstatus: 'captured',
//   hash: '6228a67af6dee65b65db277fd4fd1610a47a41cc232ea54853abb3e109a15fb5f744866e490159e932ab057122e3d93b55f12e42916f27a879ce50a9cf4366d5',
//   bank_ref_no: 'TXN_1745344618674_7fdqty',
//   bank_ref_num: 'TXN_1745344618674_7fdqty',
//   bankcode: 'UPI',
//   surl: 'http://localhost:3000/payment/success',
//   curl: 'http://localhost:3000/payment/failure',
//   furl: 'http://localhost:3000/payment/failure',
//   pa_name: 'PayU'
// }

// const refundResponse = {
//   additionalValue1: null,
//   bank_arn: null,
//   refund_mode: 'Back to Source',
//   bank_ref_num: '23182xxx8372',
//   key: '90xxtdp',
//   amt: '7873.54',
//   remark: null,
//   status: 'success',
//   token: '702866_xxxx426702',
//   mihpayid: '162xxxx27943',
//   request_id: '1128xxxx52420',
//   merchantTxnId: '216xx626',
//   additionalValue2: null,
//   action: 'refund'
// }

export class PayUWebhook {
  payuGateway: PayUPaymentGateway

  constructor() {
    this.payuGateway = new PayUPaymentGateway()
  }

  async create(data: any, params: Params) {
    console.log('Payu webhook received ====> ', JSON.stringify(data))
    try {
      if (data?.key === payUMerchantKey) {
        // const paymentObject = await this.payuGateway.verifyPayment(data)
        const paymentData = this.payuGateway?.createPaymentResponsePayload(data)

        // Skip if payment made from web and mobile web
        // if (
        //   paymentData?.deviceType &&
        //   (paymentData?.deviceType === 'web' || paymentData?.deviceType === 'mobile-web')
        // )
        //   return { success: true }

        try {
          switch (data.status) {
            case 'success':
              await onPaymentCaptured(paymentData)
              break
            case 'failure':
              await onPaymentFailed(paymentData)

              break
            case 'refund.processed':
              break
            default:
              return { success: true }
          }

          return { success: true }
        } catch (e) {
          console.log('Error processing webhook event ==>', e)
        }
      } else {
        throw new Error('Payu webhook error: Invalid Merchant key received in response')
      }
    } catch (error) {
      throw error
    }
  }
}
