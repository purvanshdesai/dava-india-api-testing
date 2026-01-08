// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  AppInstallReferrerTracker,
  AppInstallReferrerTrackerData,
  AppInstallReferrerTrackerPatch,
  AppInstallReferrerTrackerQuery,
  AppInstallReferrerTrackerService
} from './app-install-referrer-tracker.class'

export type {
  AppInstallReferrerTracker,
  AppInstallReferrerTrackerData,
  AppInstallReferrerTrackerPatch,
  AppInstallReferrerTrackerQuery
}

export type AppInstallReferrerTrackerClientService = Pick<
  AppInstallReferrerTrackerService<Params<AppInstallReferrerTrackerQuery>>,
  (typeof appInstallReferrerTrackerMethods)[number]
>

export const appInstallReferrerTrackerPath = 'app-install-referrer-tracker'

export const appInstallReferrerTrackerMethods: Array<keyof AppInstallReferrerTrackerService> = ['create']

export const appInstallReferrerTrackerClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(appInstallReferrerTrackerPath, connection.service(appInstallReferrerTrackerPath), {
    methods: appInstallReferrerTrackerMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [appInstallReferrerTrackerPath]: AppInstallReferrerTrackerClientService
  }
}
