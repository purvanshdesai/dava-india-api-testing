// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'
import {
  inventoryBulkUploadDataValidator,
  inventoryBulkUploadPatchValidator,
  inventoryBulkUploadQueryValidator,
  inventoryBulkUploadResolver,
  inventoryBulkUploadExternalResolver,
  inventoryBulkUploadDataResolver,
  inventoryBulkUploadPatchResolver,
  inventoryBulkUploadQueryResolver
} from './inventory-bulk-upload.schema'

import type { Application } from '../../../declarations'
import {
  InventoryBulkUploadService,
  SuperAdminInventoryBulkUploadService,
  getOptions
} from './inventory-bulk-upload.class'
import {
  inventoryBulkUploadPath,
  adminInventoryBulkUploadPath,
  inventoryBulkUploadMethods
} from './inventory-bulk-upload.shared'
import { ObjectId } from 'mongodb'
import { StoreInventoryModel } from '../../store-inventory/store-inventory.schema'

export * from './inventory-bulk-upload.class'
export * from './inventory-bulk-upload.schema'

async function validateUsers(excelUsers: any[], storeId: any) {
  let validUsers: any[] = []
  let invalidUsers: any[] = []
  for (const user of excelUsers) {
    const errors: any = await validateUser(user, storeId)
    if (errors.length === 0) {
      validUsers.push(user)
    } else {
      user.errors = errors
      invalidUsers.push(user)
    }
  }
  return { validUsers, invalidUsers }
}

async function validateUser(user: any, storeId: any) {
  let errors = []
  const isExistProductId = await validProductId(user.productId, storeId)
  if (!isExistProductId) {
    errors.push('Invalid Product ID')
  }
  return errors
}

async function validProductId(productId: any, storeId: any) {
  const healthWorker = await StoreInventoryModel.findOne({
    productId: new ObjectId(productId),
    storeId: storeId
  }).lean()
  return healthWorker ? true : false
}

// A configure function that registers the service and its hooks via `app.configure`
export const inventoryBulkUpload = (app: Application) => {
  // Register our service on the Feathers application
  app.use(inventoryBulkUploadPath, new InventoryBulkUploadService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: inventoryBulkUploadMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })

  app.use(adminInventoryBulkUploadPath, new SuperAdminInventoryBulkUploadService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: inventoryBulkUploadMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })

  // Initialize hooks
  app.service(inventoryBulkUploadPath).hooks({
    around: {
      all: [
        // authenticate('jwt'),
        authenticate({
          service: 'store-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(inventoryBulkUploadExternalResolver),
        schemaHooks.resolveResult(inventoryBulkUploadResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(inventoryBulkUploadQueryValidator),
        schemaHooks.resolveQuery(inventoryBulkUploadQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        // inventoryBulkUploadS,
        schemaHooks.validateData(inventoryBulkUploadDataValidator),
        schemaHooks.resolveData(inventoryBulkUploadDataResolver)
      ],
      patch: [
        schemaHooks.validateData(inventoryBulkUploadPatchValidator),
        schemaHooks.resolveData(inventoryBulkUploadPatchResolver)
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

  app.service(adminInventoryBulkUploadPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'super-admin/authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(inventoryBulkUploadExternalResolver),
        schemaHooks.resolveResult(inventoryBulkUploadResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(inventoryBulkUploadQueryValidator),
        schemaHooks.resolveQuery(inventoryBulkUploadQueryResolver)
      ],
      find: [],
      get: [],
      create: [
        // inventoryBulkUploadS,
        schemaHooks.validateData(inventoryBulkUploadDataValidator),
        schemaHooks.resolveData(inventoryBulkUploadDataResolver)
      ],
      patch: [
        schemaHooks.validateData(inventoryBulkUploadPatchValidator),
        schemaHooks.resolveData(inventoryBulkUploadPatchResolver)
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
}

// Add this service to the service type index
declare module '../../../declarations' {
  interface ServiceTypes {
    [inventoryBulkUploadPath]: InventoryBulkUploadService
    [adminInventoryBulkUploadPath]: SuperAdminInventoryBulkUploadService
  }
}
