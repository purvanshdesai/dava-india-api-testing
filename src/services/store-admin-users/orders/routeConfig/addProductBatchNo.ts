import type { Application } from '../../../../declarations'
import {
  storeAdminAddProductBatchNoMethods,
  storeAdminAddProductBatchNoPath,
  storeAdminUsersOrdersMethods,
  storeAdminUsersOrdersPath
} from '../orders.shared'
import { getOptions, StoreAdminAddProductBatchNoService, StoreAdminUsersOrdersService } from '../orders.class'
import { authenticate } from '@feathersjs/authentication'
import { hooks as schemaHooks } from '@feathersjs/schema'
import {
  storeAdminUsersOrdersDataResolver,
  storeAdminUsersOrdersDataValidator,
  storeAdminUsersOrdersExternalResolver,
  storeAdminUsersOrdersPatchResolver,
  storeAdminUsersOrdersPatchValidator,
  storeAdminUsersOrdersQueryResolver,
  storeAdminUsersOrdersQueryValidator,
  storeAdminUsersOrdersResolver
} from '../orders.schema'

export const storeAdminAddProductBatchEndPoint = (app: Application) => {
  // Register our service on the Feathers application
  app.use(storeAdminAddProductBatchNoPath, new StoreAdminAddProductBatchNoService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: storeAdminAddProductBatchNoMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  // app.service(storeAdminUsersOrdersPath).hooks({
  //   around: {
  //     all: [
  //       authenticate({
  //         service: 'store-admin/authentication',
  //         strategies: ['jwt']
  //       }),
  //       schemaHooks.resolveExternal(storeAdminUsersOrdersExternalResolver),
  //       schemaHooks.resolveResult(storeAdminUsersOrdersResolver)
  //     ]
  //   },
  //   before: {
  //     all: [
  //       schemaHooks.validateQuery(storeAdminUsersOrdersQueryValidator),
  //       schemaHooks.resolveQuery(storeAdminUsersOrdersQueryResolver)
  //     ],
  //     find: [],
  //     get: [],
  //     create: [
  //       schemaHooks.validateData(storeAdminUsersOrdersDataValidator),
  //       schemaHooks.resolveData(storeAdminUsersOrdersDataResolver)
  //     ],
  //     patch: [
  //       schemaHooks.validateData(storeAdminUsersOrdersPatchValidator),
  //       schemaHooks.resolveData(storeAdminUsersOrdersPatchResolver)
  //     ],
  //     remove: []
  //   },
  //   after: {
  //     all: []
  //   },
  //   error: {
  //     all: []
  //   }
  // })
}
