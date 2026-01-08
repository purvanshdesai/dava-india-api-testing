// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Params } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type {
  PrescriptionStatus,
  PrescriptionStatusData,
  PrescriptionStatusPatch,
  PrescriptionStatusQuery
} from './prescription-status.schema'
import { CONSTANTS, TicketsModel } from '../tickets/tickets.schema'
import { BadRequest } from '@feathersjs/errors'
import { ConsultationModal } from '../consultations/consultations.schema'
import moment from 'moment'
import { TicketActivitiesModel } from '../support/support.schema'
import { ProductsModel } from '../super-admin/products/products.schema'
import { notificationServices } from '../../socket/namespaceManager'

export type { PrescriptionStatus, PrescriptionStatusData, PrescriptionStatusPatch, PrescriptionStatusQuery }

export interface PrescriptionStatusServiceOptions {
  app: Application
}

export interface PrescriptionStatusParams extends Params<PrescriptionStatusQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class PrescriptionStatusService {
  constructor(public options: PrescriptionStatusServiceOptions) {}

  async find() {}

  async get() {}
  async handleAcceptPrescription(data: PrescriptionStatusData, params: Params<PrescriptionStatusQuery>) {
    try {
      const { ticketId, items } = data
      const ticket = await TicketsModel.findById(ticketId).lean()
      // const order = await OrderModel.findById(ticket?.order)
      if (!ticket) throw new BadRequest('Invalid ticket')
      const consultation = await ConsultationModal.findOne({ ticket: ticket?._id }).lean()
      await TicketActivitiesModel.create({
        ticket: ticket._id,
        createdAt: new Date(),
        createdByUserType: CONSTANTS.CREATED_BY_USER_TYPE.SUPER_ADMIN,
        createdBy: params?.user?._id,
        activity: 'prescription-approved',
        content: consultation?.prescriptionUrl
      })
      // order.set('prescription.consultationId', consultation.id)
      // order.set('consultationStatus', 'prescription_reviewed')

      let totalPrice = 0
      let products = []
      for (const item of items) {
        const product = await ProductsModel.findById(item?.productId).lean()
        if (product?.finalPrice) {
          totalPrice = totalPrice + product?.finalPrice * item?.quantity
        }
        products.push(product)
      }
      let orderItems = items.map((item) => ({
        productId: item?.productId,
        quantity: item.quantity,
        amount: products.find((productItem) => item?.productId == productItem?._id?.toString())?.finalPrice,
        total:
          products.find((productItem) => item?.productId == productItem?._id?.toString())?.finalPrice! *
          item?.quantity
      }))
      await ConsultationModal.findByIdAndUpdate(consultation?._id, {
        ticketType: 'uploadPrescription',
        // ticket: ticket?._id,
        // prescriptionUrl: order.get('prescription.url'),
        status: 'ready_for_order',
        userId: ticket?.createdBy,
        consultDate: moment().toDate(),
        type: 'online',
        medicines: orderItems.map((item) => ({
          productId: item?.productId,
          quantity: item?.quantity
        }))
        // orderId: order.id
      })
      // order.set('orderTotal', totalPrice)
      // order.set('paymentAmount', totalPrice)
      // order.set('items', orderItems)
      // await order.save()
      // app.service('order').create({
      //   orderType:'consultation',
      //   consultationId: consultation?._id
      // })
      notificationServices.userNotifications.sendNotificationToUser(ticket?.createdBy, {
        recipientId: ticket?.createdBy,
        recipientType: 'user',
        title: 'Consultation Order',
        message: 'Order created for consultation',
        type: 'consultation',
        data: {
          consultationId: consultation?._id
        },
        isRead: false,
        createdAt: moment().toDate(),
        priority: 'normal'
      })
      return {
        message: 'Prescription accepted'
      }
    } catch (error) {
      throw error
    }
  }

  async handleRejectPrescription(data: PrescriptionStatusData, params: Params<PrescriptionStatusQuery>) {
    try {
      const { ticketId, items } = data
      const ticket = await TicketsModel.findById(ticketId).lean()
      const consultation = await ConsultationModal.findOne({ ticket: ticket?._id })
      if (!ticket || !consultation) throw new BadRequest('Invalid ticket')
      await TicketActivitiesModel.create({
        ticket: ticket._id,
        createdAt: new Date(),
        createdByUserType: CONSTANTS.CREATED_BY_USER_TYPE.SUPER_ADMIN,
        createdBy: params?.user?._id,
        activity: 'prescription-rejected',
        content: consultation?.prescriptionUrl
      })
      consultation.set('status', 'prescription_declined')
      await consultation.save()
      return {
        message: 'Prescription rejected'
      }
    } catch (error) {
      throw error
    }
  }

  async create(data: PrescriptionStatusData, params: Params<PrescriptionStatusQuery>) {
    try {
      const { status } = data
      if (status == 'accept') {
        return this.handleAcceptPrescription(data, params)
      } else if (status == 'reject') {
        return this.handleRejectPrescription(data, params)
      }
    } catch (error) {
      throw error
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
