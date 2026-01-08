// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type { General, GeneralData, GeneralPatch, GeneralQuery } from './general.schema'
import { sendSMS } from '../../utils/sendSms'
import { sendEmail } from '../../utils/sendEmail'
import appShareLink from '../../templates/appShareLink'
import { app } from '../../app'
export type { General, GeneralData, GeneralPatch, GeneralQuery }

export interface GeneralServiceOptions {
  app: Application
}

export interface GeneralParams extends Params<GeneralQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class GeneralService<ServiceParams extends GeneralParams = GeneralParams>
  implements ServiceInterface<General, GeneralData, ServiceParams, GeneralPatch>
{
  constructor(public options: GeneralServiceOptions) {}

  async find(_params?: ServiceParams): Promise<General[]> {
    return []
  }

  async create(data: any, params?: any): Promise<any> {
    const { sharingMedium, shareWith } = data

    const formatToE164 = (phoneNumber: string) => {
      let cleanedNumber = phoneNumber.replace(/[^\d+]/g, '')

      if (cleanedNumber.startsWith('0')) {
        cleanedNumber = cleanedNumber.slice(1)
      }

      if (!cleanedNumber.startsWith('+')) {
        cleanedNumber = `+91${cleanedNumber}`
      }

      return cleanedNumber
    }

    const smsBody = `Links:

  Android: https://play.google.com/store/apps/details?id=com.davaindia
  
  iOS:  https://apps.apple.com/in/app/davaindia-generic-pharmacy/id6741474883`

    const response =
      sharingMedium === 'phone'
        ? await sendSMS(formatToE164(shareWith), smsBody)
        : await sendEmail({
            to: shareWith,
            subject: 'Continue to the App Experience',
            message: appShareLink(),
            attachments: []
          })

    if (response) {
      return { success: true, response }
    } else {
      throw new Error('Failed to send')
    }
  }
}

export class VersionUpdateService<ServiceParams extends GeneralParams = GeneralParams>
  implements ServiceInterface<General, GeneralData, ServiceParams, GeneralPatch>
{
  constructor(public options: GeneralServiceOptions) {}

  async find(_params?: ServiceParams): Promise<any> {
    try {
      const android = app.get('android')
      const ios = app.get('ios')

      return {
        android,
        ios
      }
    } catch (error) {
      console.log(error)
    }
  }

  async create(data: any, params?: any): Promise<any> {}
}

export const getOptions = (app: Application) => {
  return { app }
}
