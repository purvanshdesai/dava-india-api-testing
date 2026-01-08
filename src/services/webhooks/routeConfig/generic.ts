import type { Application } from '../../../declarations'
import { webhooksMethods, webhooksPath } from '../webhooks.shared'
import { getOptions, WebhooksService } from '../webhooks.class'

export const GenericWebhooks = (app: Application) => {
  // Register our service on the Feathers application
  app.use(webhooksPath, new WebhooksService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: webhooksMethods,
    // You can add additional custom events to be sent to clients here
    events: []
  })
  // Initialize hooks
  // app.service(webhooksPath).hooks({
  //   around: {
  //     all: [
  //       schemaHooks.resolveExternal(webhooksExternalResolver),
  //       schemaHooks.resolveResult(webhooksResolver)
  //     ]
  //   },
  //   before: {
  //     all: [
  //       schemaHooks.validateQuery(webhooksQueryValidator),
  //       schemaHooks.resolveQuery(webhooksQueryResolver)
  //     ],
  //     find: [],
  //     get: [],
  //     create: [
  //       schemaHooks.validateData(webhooksDataValidator),
  //       schemaHooks.resolveData(webhooksDataResolver)
  //     ],
  //     patch: [
  //       schemaHooks.validateData(webhooksPatchValidator),
  //       schemaHooks.resolveData(webhooksPatchResolver)
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
