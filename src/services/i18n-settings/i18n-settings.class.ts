// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type {
  I18NSettings,
  I18NSettingsData,
  I18NSettingsPatch,
  I18NSettingsQuery
} from './i18n-settings.schema'
import { I18NSettingModel } from './i18n-settings.schema'

export type { I18NSettings, I18NSettingsData, I18NSettingsPatch, I18NSettingsQuery }

export interface I18NSettingsParams extends MongoDBAdapterParams<I18NSettingsQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class I18NSettingsService<ServiceParams extends Params = I18NSettingsParams> extends MongoDBService<
  I18NSettings,
  I18NSettingsData,
  I18NSettingsParams,
  I18NSettingsPatch
> {}

export class I18NTranslationService<ServiceParams extends Params = I18NSettingsParams> extends MongoDBService<
  I18NSettings,
  I18NSettingsData,
  I18NSettingsParams,
  I18NSettingsPatch
> {
  async find(params: Params | any): Promise<any> {
    try {
      const resultTranslations: any = {}

      const code: string = params.query?.code || 'en'

      const i18Settings = await I18NSettingModel.find({}).lean()

      for (const langSetting of i18Settings) {
        const group = langSetting.groups
        const lookupKey = langSetting.lookup_key

        // Initialize group if it doesn't exist
        if (!resultTranslations[group]) {
          resultTranslations[group] = {}
        }

        // Get the text for the given language code, defaulting to English if code is not specified
        let text = langSetting.text
        if (code !== 'en' && langSetting.translations[code]) {
          text = langSetting.translations[code].text
        }

        // Assign the text to the corresponding lookup key within the group
        resultTranslations[group][lookupKey] = text
      }

      return resultTranslations
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('i18n-settings'))
  }
}
