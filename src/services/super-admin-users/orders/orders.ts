// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  superAdminOrdersDataValidator,
  superAdminOrdersPatchValidator,
  superAdminOrdersQueryValidator,
  superAdminOrdersResolver,
  superAdminOrdersExternalResolver,
  superAdminOrdersDataResolver,
  superAdminOrdersPatchResolver,
  superAdminOrdersQueryResolver
} from './orders.schema'

import type { Application } from '../../../declarations'
import {
  CheckoutSessionFailedOrders,
  CreateTicketFromAdminService,
  SuperAdminOrdersService,
  CancelOrderActionsService,
  OrderSkipLogisticsService,
  ModifyReturnService,
  getOptions,
  type AddProductBatchNoService
} from './orders.class'
import {
  superAdminOrdersPath,
  superAdminOrdersMethods,
  addProductBatchNoPath,
  cancelOrderActionPath,
  checkoutSessionFailedOrdersPath,
  createTickerFromAdminPath,
  orderSkipLogisticsPath,
  modifyReturnPath
} from './orders.shared'
import AddProductBatchNoEndPoint from './routeConfig/addProductBatchNo'
import CheckoutSessionFailedOrdersEndPoint from './routeConfig/checkoutFailedOrder'
import CreateTicketFromAdminEndPoint from './routeConfig/createTicketFromAdmin'
import skipLogistics from './routeConfig/skipLogistics'
import { authenticateHook } from '../../../utils'
import { cancelOrderEndPoint } from './routeConfig/orderCancelAction'
import { modifyReturnEndPoint } from './routeConfig/modifyReturn'

export * from './orders.class'
export * from './orders.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const superAdminOrders = (app: Application) => {
  // Register our service on the Feathers application
  app.use(superAdminOrdersPath, new SuperAdminOrdersService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: superAdminOrdersMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  app.service(superAdminOrdersPath).hooks({
    around: {
      all: [
        // authenticate({
        //   service: 'super-admin/authentication',
        //   strategies: ['jwt']
        // }),
        authenticateHook,
        schemaHooks.resolveExternal(superAdminOrdersExternalResolver),
        schemaHooks.resolveResult(superAdminOrdersResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(superAdminOrdersQueryValidator),
        schemaHooks.resolveQuery(superAdminOrdersQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(superAdminOrdersDataValidator),
        schemaHooks.resolveData(superAdminOrdersDataResolver)
      ],
      patch: [
        schemaHooks.validateData(superAdminOrdersPatchValidator),
        schemaHooks.resolveData(superAdminOrdersPatchResolver)
      ],
      remove: []
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })

  AddProductBatchNoEndPoint(app)
  CheckoutSessionFailedOrdersEndPoint(app)
  CreateTicketFromAdminEndPoint(app)
  skipLogistics(app)
  cancelOrderEndPoint(app)
  modifyReturnEndPoint(app)
}

// Add this service to the service type index
declare module '../../../declarations' {
  interface ServiceTypes {
    [superAdminOrdersPath]: SuperAdminOrdersService
    [addProductBatchNoPath]: AddProductBatchNoService
    [checkoutSessionFailedOrdersPath]: CheckoutSessionFailedOrders
    [createTickerFromAdminPath]: CreateTicketFromAdminService
    [cancelOrderActionPath]: CancelOrderActionsService
    [orderSkipLogisticsPath]: OrderSkipLogisticsService
    [modifyReturnPath]: ModifyReturnService
  }
}
