// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type {
  ConsultationItems,
  ConsultationItemsData,
  ConsultationItemsPatch,
  ConsultationItemsQuery
} from './consultation-items.schema'
import { ConsultationModal } from '../consultations/consultations.schema'

export type { ConsultationItems, ConsultationItemsData, ConsultationItemsPatch, ConsultationItemsQuery }

export interface ConsultationItemsServiceOptions {
  app: Application
}

export interface ConsultationItemsParams extends Params<ConsultationItemsQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class ConsultationItemsService {
  constructor(public options: ConsultationItemsServiceOptions) {}

  async get(id: Id) {
    try {
      const consultation = await ConsultationModal.findOne({ ticket: id })
        .populate('medicines.productId')
        .lean()
      if (!consultation) {
        return null
      }
      return consultation
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
