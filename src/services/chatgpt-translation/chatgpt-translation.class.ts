// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Params } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type {
  ChatgptTranslation,
  ChatgptTranslationData,
  ChatgptTranslationPatch,
  ChatgptTranslationQuery
} from './chatgpt-translation.schema'
import { getOptimalGptAccount, initializeGptAccountsInRedis, makeChatGptApiCall } from '../../utils/chatGpt'
import { prompts } from '../../utils/prompts/translations'

export type { ChatgptTranslation, ChatgptTranslationData, ChatgptTranslationPatch, ChatgptTranslationQuery }

export interface ChatgptTranslationServiceOptions {
  app: Application
}

export interface ChatgptTranslationParams extends Params<ChatgptTranslationQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class ChatgptTranslationService {
  constructor(public options: ChatgptTranslationServiceOptions) {}

  async find() {}

  async get() {}

  async create(data: ChatgptTranslationData) {
    try {
      // return {
      //   translations: {
      //     en: 'Search',
      //     bn: 'অনুসন্ধান',
      //     gu: 'શોધો',
      //     hi: 'खोज',
      //     kn: 'ಹುಡುಕು',
      //     ml: 'തിരയുക',
      //     mr: 'शोध',
      //     or: 'ଖୋଜି',
      //     pa: 'ਖੋਜ',
      //     ta: 'தேடல்',
      //     te: 'శోధన',
      //     as: 'অনুসন্ধান',
      //     ne: 'खोज',
      //     mni: 'ꯑꯣꯛ'
      //   }
      // }
      const promptType = data?.translateType ? data.translateType : 'translate'
      await initializeGptAccountsInRedis()
      const account: any = await getOptimalGptAccount(data.text)
      const { response } = await makeChatGptApiCall(
        account.apiKey,
        prompts[promptType](data.text, data.translationFor)
      )
      const translationsArrayString =
        Array.isArray(response?.data?.choices) &&
        response?.data?.choices?.length &&
        response?.data?.choices[0]?.message?.content
          ? response?.data?.choices[0]?.message?.content
          : null
      if (!translationsArrayString) {
        return {
          translations: null
        }
      }
      const translationsArray = JSON.parse(translationsArrayString)
      const translations = translationsArray.reduce((acc: any, item: any) => {
        const [key, value] = Object.entries(item)[0]
        acc[key] = value
        return acc
      }, {})
      return {
        translations
      }
    } catch (error) {
      return {
        translations: null
      }
    }
  }

  // This method has to be added to the 'methods' option to make it available to clients
  async update() {}

  async patch() {}

  async remove() {}
}

export const getOptions = (app: Application) => {
  return { app }
}
