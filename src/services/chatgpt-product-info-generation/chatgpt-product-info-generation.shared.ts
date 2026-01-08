// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  ChatgptProductInfoGeneration,
  ChatgptProductInfoGenerationData,
  ChatgptProductInfoGenerationPatch,
  ChatgptProductInfoGenerationQuery,
  ChatgptProductInfoGenerationService
} from './chatgpt-product-info-generation.class'

export type {
  ChatgptProductInfoGeneration,
  ChatgptProductInfoGenerationData,
  ChatgptProductInfoGenerationPatch,
  ChatgptProductInfoGenerationQuery
}

export type ChatgptProductInfoGenerationClientService = Pick<
  ChatgptProductInfoGenerationService,
  (typeof chatgptProductInfoGenerationMethods)[number]
>

export const chatgptProductInfoGenerationPath = 'chatgpt-product-info-generation'

export const chatgptProductInfoGenerationMethods: Array<keyof ChatgptProductInfoGenerationService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const chatgptProductInfoGenerationClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(chatgptProductInfoGenerationPath, connection.service(chatgptProductInfoGenerationPath), {
    methods: chatgptProductInfoGenerationMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [chatgptProductInfoGenerationPath]: ChatgptProductInfoGenerationClientService
  }
}
