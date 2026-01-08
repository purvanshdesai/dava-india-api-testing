// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import multer from '@koa/multer'

import type { Application } from '../../declarations'
import { AttachmentsService, getOptions } from './attachments.class'
import { attachmentsPath, attachmentsMethods } from './attachments.shared'

export * from './attachments.class'
export * from './attachments.schema'

const multerUpload = multer()

// A configure function that registers the service and its hooks via `app.configure`
export const attachments = (app: Application) => {
  // Register our service on the Feathers application
  app.use(attachmentsPath, new AttachmentsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: attachmentsMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
    koa: {
      before: [
        async (ctx, next) => {
          const contentType = ctx.request.headers['content-type']
          if (contentType && contentType.includes('multipart/form-data')) {
            await multerUpload.array('attachments')(ctx, next)
          } else {
            await next()
          }
        },
        async (ctx, next) => {
          const feathers: any = ctx?.feathers
          if (feathers && typeof feathers === 'object') {
            feathers.files = ctx.files
          }
          await next()
        }
      ]
    }
  })
  // Initialize hooks
  app.service(attachmentsPath).hooks({
    around: {
      all: []
    },
    before: {
      all: [],
      find: [],
      get: [],
      create: [],
      patch: [],
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
declare module '../../declarations' {
  interface ServiceTypes {
    [attachmentsPath]: AttachmentsService
  }
}
