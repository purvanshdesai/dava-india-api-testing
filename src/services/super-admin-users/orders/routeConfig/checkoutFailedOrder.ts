import { checkoutSessionFailedOrdersMethods, checkoutSessionFailedOrdersPath } from '../orders.shared'
import { CheckoutSessionFailedOrders, getOptions } from '../orders.class'

import { Application } from '../../../../declarations'

export default function CheckoutSessionFailedOrdersEndPoint(app: Application) {
  app.use(checkoutSessionFailedOrdersPath, new CheckoutSessionFailedOrders(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: checkoutSessionFailedOrdersMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
}
