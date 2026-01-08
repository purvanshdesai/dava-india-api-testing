// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type {
  ConsultancyAppointmentSlots,
  ConsultancyAppointmentSlotsData,
  ConsultancyAppointmentSlotsPatch,
  ConsultancyAppointmentSlotsQuery
} from './consultancy-appointment-slots.schema'
import { getSlotsForDate } from '../../utils/slots'

export type {
  ConsultancyAppointmentSlots,
  ConsultancyAppointmentSlotsData,
  ConsultancyAppointmentSlotsPatch,
  ConsultancyAppointmentSlotsQuery
}

export interface ConsultancyAppointmentSlotsParams
  extends MongoDBAdapterParams<ConsultancyAppointmentSlotsQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class ConsultancyAppointmentSlotsService<
  ServiceParams extends Params = ConsultancyAppointmentSlotsParams
> extends MongoDBService<
  ConsultancyAppointmentSlots,
  ConsultancyAppointmentSlotsData,
  ConsultancyAppointmentSlotsParams,
  ConsultancyAppointmentSlotsPatch
> {
  async find(params?: ConsultancyAppointmentSlotsParams): Promise<any> {
    try {
      const { date } = params?.query as any

      if (!date) throw new Error('Select a valid date')

      const res = await getSlotsForDate(date)

      return res
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('consultancy-appointment-slots'))
  }
}
