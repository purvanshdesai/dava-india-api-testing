import type { Application } from '../../declarations'
import {
  LogisticsService,
  CourierPartnersService,
  getOptions,
  LogisticsRuleDeliveryZonesService,
  LogisticsRuleCouriersService
} from './logistics.class'
import {
  logisticsPath,
  logisticsMethods,
  courierPartnersPath,
  logisticsRuleDeliveryZonesPath,
  logisticsRuleCouriersPath
} from './logistics.shared'
import LogisticsRulesEndPoint from './routeConfig/rules'
import CourierPartnersEndPoint from './routeConfig/courierPartners'
import LogisticsRuleDeliveryZonesEndPoint from './routeConfig/ruleDeliveryZones'
import LogisticsRuleCouriersEndPoint from './routeConfig/ruleCouriers'

export * from './logistics.class'
export * from './logistics.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const logistics = (app: Application) => {
  LogisticsRulesEndPoint(app)
  CourierPartnersEndPoint(app)
  LogisticsRuleDeliveryZonesEndPoint(app)
  LogisticsRuleCouriersEndPoint(app)
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [logisticsPath]: LogisticsService
    [courierPartnersPath]: CourierPartnersService
    [logisticsRuleDeliveryZonesPath]: LogisticsRuleDeliveryZonesService
    [logisticsRuleCouriersPath]: LogisticsRuleCouriersService
  }
}
