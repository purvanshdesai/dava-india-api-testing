// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Navigations,
  NavigationsData,
  NavigationsPatch,
  NavigationsQuery,
  NavigationsService
} from './navigations.class'

export type { Navigations, NavigationsData, NavigationsPatch, NavigationsQuery }

export type NavigationsClientService = Pick<
  NavigationsService<Params<NavigationsQuery>>,
  (typeof navigationsMethods)[number]
>

export const navigationsPath = 'navigations'
export const navigationLayoutPositioningPath = 'navigations/layout-positioning'
export const consumerNavigationsPath = 'consumer/navigations'
export const consumerCollectionNavigationPath = 'consumer/collection/navigations'
export const consumerCollectionNavigationPathMobile = 'consumer/collection/navigations/mobile'

export const navigationsMethods: Array<keyof NavigationsService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const navigationsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(navigationsPath, connection.service(navigationsPath), {
    methods: navigationsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [navigationsPath]: NavigationsClientService
  }
}
