import type { Application } from '../../declarations'
import { CategoriesService, ConsumerCategoriesService } from './categories.class'
import { categoriesPath, consumerCategoriesPath } from './categories.shared'
import ConsumerCategories from './routeConfig/consumer'
import AdminCategories from './routeConfig/admin'

export * from './categories.class'
export * from './categories.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const categories = (app: Application) => {
  // Register our service on the Feathers application
  ConsumerCategories(app)
  AdminCategories(app)
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [categoriesPath]: CategoriesService
    [consumerCategoriesPath]: ConsumerCategoriesService
  }
}
