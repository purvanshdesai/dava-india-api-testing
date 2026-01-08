// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Dashboard,
  DashboardData,
  DashboardPatch,
  DashboardQuery,
  DashboardService
} from './dashboard.class'

export type { Dashboard, DashboardData, DashboardPatch, DashboardQuery }

export type DashboardClientService = Pick<
  DashboardService<Params<DashboardQuery>>,
  (typeof dashboardMethods)[number]
>

export const dashboardPath = 'dashboard'

export const dashboardMethods: Array<keyof DashboardService> = ['find']

export const dashboardClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(dashboardPath, connection.service(dashboardPath), {
    methods: dashboardMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [dashboardPath]: DashboardClientService
  }
}
