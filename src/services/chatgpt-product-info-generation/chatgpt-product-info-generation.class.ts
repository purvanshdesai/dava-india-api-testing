// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type {
  ChatgptProductInfoGeneration,
  ChatgptProductInfoGenerationData,
  ChatgptProductInfoGenerationPatch,
  ChatgptProductInfoGenerationQuery
} from './chatgpt-product-info-generation.schema'
import { getOptimalGptAccount, initializeGptAccountsInRedis, makeChatGptApiCall } from '../../utils/chatGpt'
import { prompts } from '../../utils/prompts/productInfoGeneration'

export type {
  ChatgptProductInfoGeneration,
  ChatgptProductInfoGenerationData,
  ChatgptProductInfoGenerationPatch,
  ChatgptProductInfoGenerationQuery
}

export interface ChatgptProductInfoGenerationServiceOptions {
  app: Application
}

export interface ChatgptProductInfoGenerationParams extends Params<ChatgptProductInfoGenerationQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class ChatgptProductInfoGenerationService {
  constructor(public options: ChatgptProductInfoGenerationServiceOptions) {}

  async find() {}

  async get() {}

  async create(data: ChatgptProductInfoGenerationData) {
    try {
      await initializeGptAccountsInRedis()
      const account: any = await getOptimalGptAccount(data.productName)
      const { response } = await makeChatGptApiCall(
        account.apiKey,
        prompts.aboutProduct({
          productName: data.productName,
          productComposition: data.productCompositions,
          productDescription: data.productDescription ? data.productDescription : ''
        })
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
      const information = JSON.parse(translationsArrayString)
      return {
        information
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
