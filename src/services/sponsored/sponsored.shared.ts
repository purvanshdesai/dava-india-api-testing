// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  Sponsored,
  SponsoredData,
  SponsoredPatch,
  SponsoredQuery,
  SponsoredService
} from './sponsored.class'
import { HookContext } from '../../declarations'

export type { Sponsored, SponsoredData, SponsoredPatch, SponsoredQuery }

export type SponsoredClientService = Pick<
  SponsoredService<Params<SponsoredQuery>>,
  (typeof sponsoredMethods)[number]
>

export const sponsoredPath = 'sponsored'
export const sponsoredLayoutPositioningPath = 'sponsored/layout-positioning'
export const sponsoredBannerPath = 'sponsored-banners'
export const sponsoredConsumerPath = 'sponsored-layout/consumer'

export const sponsoredMethods: Array<keyof SponsoredService> = ['find', 'get', 'create', 'patch', 'remove']

export const sponsoredClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(sponsoredPath, connection.service(sponsoredPath), {
    methods: sponsoredMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [sponsoredPath]: SponsoredClientService
  }
}

// Hook to set date fields
export const setTimestamp = async (context: HookContext) => {
  const { data, method } = context

  if (method === 'create') {
    data.createdAt = new Date().toISOString()
  }
  data.updatedAt = new Date().toISOString()
  return context
}

export const assignPosition = async (context: HookContext) => {
  const { data, method } = context

  if (method === 'create') data.position = 1000

  return context
}
