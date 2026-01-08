import { addProductBatchNoMethods, addProductBatchNoPath } from '../orders.shared'
import { AddProductBatchNoService, getOptions } from '../orders.class'
// import { authenticate } from '@feathersjs/authentication'
// import { hooks as schemaHooks } from '@feathersjs/schema'
// import {
//   superAdminOrdersDataResolver,
//   superAdminOrdersDataValidator,
//   superAdminOrdersExternalResolver,
//   superAdminOrdersPatchResolver,
//   superAdminOrdersPatchValidator,
//   superAdminOrdersQueryResolver,
//   superAdminOrdersQueryValidator,
//   superAdminOrdersResolver
// } from '../orders.schema'
import { Application } from '../../../../declarations'

export default function AddProductBatchNoEndPoint(app: Application) {
  app.use(addProductBatchNoPath, new AddProductBatchNoService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: addProductBatchNoMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  // app.service(addProductBatchNoPath).hooks({
  //   around: {
  //     all: [
  //       authenticate({
  //         service: 'super-admin/authentication',
  //         strategies: ['jwt']
  //       }),
  //       schemaHooks.resolveExternal(superAdminOrdersExternalResolver),
  //       schemaHooks.resolveResult(superAdminOrdersResolver)
  //     ]
  //   },
  //   before: {
  //     all: [
  //       schemaHooks.validateQuery(superAdminOrdersQueryValidator),
  //       schemaHooks.resolveQuery(superAdminOrdersQueryResolver)
  //     ],
  //     find: [],
  //     get: [],
  //     create: [
  //       schemaHooks.validateData(superAdminOrdersDataValidator),
  //       schemaHooks.resolveData(superAdminOrdersDataResolver)
  //     ],
  //     patch: [
  //       schemaHooks.validateData(superAdminOrdersPatchValidator),
  //       schemaHooks.resolveData(superAdminOrdersPatchResolver)
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
