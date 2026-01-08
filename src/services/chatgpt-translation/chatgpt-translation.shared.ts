// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  ChatgptTranslation,
  ChatgptTranslationData,
  ChatgptTranslationPatch,
  ChatgptTranslationQuery,
  ChatgptTranslationService
} from './chatgpt-translation.class'

export type { ChatgptTranslation, ChatgptTranslationData, ChatgptTranslationPatch, ChatgptTranslationQuery }

export type ChatgptTranslationClientService = Pick<
  ChatgptTranslationService,
  (typeof chatgptTranslationMethods)[number]
>

export const chatgptTranslationPath = 'chatgpt-translation'

export const chatgptTranslationMethods: Array<keyof ChatgptTranslationService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const chatgptTranslationClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(chatgptTranslationPath, connection.service(chatgptTranslationPath), {
    methods: chatgptTranslationMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [chatgptTranslationPath]: ChatgptTranslationClientService
  }
}
