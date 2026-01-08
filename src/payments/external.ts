import axios from 'axios'
import { logger } from '../logger'
import { OrderData } from '../client'

export const trackOrderViaPostBack = async (order: OrderData | any) => {
  try {
    const { click_id } = order?.utmParams ?? {}

    if (!click_id || order.status !== 'paid') return

    // Get ClickId from order utmParams
    const clickId = click_id
    const orderValue = order.orderTotal
    const orderId = order.orderId

    const url = `https://cashkaro.trackier.co/acquisition?click_id=${clickId}&security_token=02d89f1125da64ba88f8&sale_amount=${orderValue}&txn_id=${orderId}`

    await axios
      .get(url)
      .then((response) => {
        logger.info('Postback Push Success:', response.data)
      })
      .catch((error) => {
        logger.error('Postback Error:', error)
      })
  } catch (e) {
    logger.error(e)
  }
}
