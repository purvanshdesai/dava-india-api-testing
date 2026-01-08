import { Application } from '../../../../declarations'
import { orderSkipLogisticsPath } from '../orders.shared'
import { OrderSkipLogisticsService } from '../orders.class'
import { authenticateHook } from '../../../../utils'

export default function skipLogistics(app: Application) {
  app.use(orderSkipLogisticsPath, new OrderSkipLogisticsService(app), {
    methods: ['update'],

    events: []
  })

  app.service(orderSkipLogisticsPath).hooks({
    around: {
      all: [authenticateHook]
    }
  })
}
