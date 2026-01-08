// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import {
  Settings,
  SettingsData,
  SettingsDb,
  SettingsModel,
  SettingsPatch,
  SettingsQuery
} from './settings.schema'

export type { Settings, SettingsData, SettingsPatch, SettingsQuery }

export interface SettingsServiceOptions {
  app: Application
}

export interface SettingsParams extends Params<SettingsQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class SettingsService<ServiceParams extends SettingsParams = SettingsParams>
  implements ServiceInterface<Settings, SettingsData, ServiceParams, SettingsPatch>
{
  constructor(public options: SettingsServiceOptions) {}

  async find(_params?: ServiceParams): Promise<any> {
    return await SettingsModel.find().lean()
  }

  async get(id: Id, _params?: ServiceParams): Promise<any> {
    return {}
  }

  async create(data: SettingsData, params?: ServiceParams): Promise<any> {
    const { settings } = data
    const filter = {
      $or: settings.map((s) => ({ settingType: s.settingType, settingCategory: s.settingCategory }))
    }
    const currentSettings = await SettingsModel.find(filter).lean()
    for (const setting of settings) {
      const settingsExist = currentSettings.find(
        (s) => s.settingType === setting.settingType && s.settingCategory === setting.settingCategory
      )
      if (settingsExist)
        await SettingsModel.findByIdAndUpdate(settingsExist._id, { ...setting, updatedAt: new Date() })
      else await SettingsModel.create({ ...setting, createdAt: new Date(), updatedAt: new Date() })
    }
    return {}
  }

  // This method has to be added to the 'methods' option to make it available to clients
  async update(id: NullableId, data: SettingsData, _params?: ServiceParams): Promise<any> {
    return {}
  }

  async patch(id: NullableId, data: SettingsPatch, _params?: ServiceParams): Promise<any> {
    return {}
  }

  async remove(id: NullableId, _params?: ServiceParams): Promise<any> {
    return {}
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
