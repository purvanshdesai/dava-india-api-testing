// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import type {
  ConsumerTicket,
  ConsumerTicketData,
  ConsumerTicketPatch,
  ConsumerTicketQuery
} from './consumer-ticket.schema'
import { BadRequest } from '@feathersjs/errors'
import { OrderModel } from '../order/order.schema'
import { ProductsModel } from '../super-admin/products/products.schema'
import { nanoid } from 'nanoid'
import { CONSTANTS, TicketsModel } from '../tickets/tickets.schema'
import { createAppointmentId, createTicketId } from '../tickets/tickets.class'
import { MODULES_PERMISSIONS } from '../../constants/permissions'
import { PermissionsModel } from '../permissions/permissions.schema'
import { ModulesModel } from '../modules/modules.schema'
import { RolesModel } from '../roles/roles.schema'
import { SuperAdminUsersModel } from '../super-admin-users/super-admin-users.schema'
import { TicketActivitiesModel } from '../support/support.schema'
import { ConsultationModal } from '../consultations/consultations.schema'
import moment from 'moment'
import {
  getPermissionTypeFromIssue,
  getTicketIssueParentCategory,
  TICKET_ISSUE_CATEGORY_MAPPING
} from '../../constants/general'
import { getUsersWithSupportTicketPermission } from '../../cache/redis/permissions'
import { Types } from 'mongoose'

export type { ConsumerTicket, ConsumerTicketData, ConsumerTicketPatch, ConsumerTicketQuery }

export interface ConsumerTicketServiceOptions {
  app: Application
}

export interface ConsumerTicketParams extends Params<ConsumerTicketQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class ConsumerTicketService {
  constructor(public options: ConsumerTicketServiceOptions) {}

  async find() {}

  async get() {}
  async createAppId() {
    const timestamp = moment().format('MMYY')
    const prevTotal = await ConsultationModal.countDocuments({})

    return timestamp + prevTotal
  }

  async handleUploadPrescription(data: ConsumerTicketData, params: Params<ConsumerTicketQuery>) {
    try {
      const user = params.user
      const { items = [], prescription_url, issue, address } = data
      if (!prescription_url) throw new BadRequest('Prescription not found')
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

      let assignee: any = null

      const supportUsers = await getUsersWithSupportTicketPermission(issue)
      if (supportUsers?.length)
        assignee = new Types.ObjectId(supportUsers[Math.floor(Math.random() * supportUsers.length)])

      const issueParentCategory = getTicketIssueParentCategory(issue)

      const ticket = await TicketsModel.create({
        ticketId: await createTicketId(),
        // order: order.id,
        comment: '',
        issue,
        issueParentCategory,
        status: CONSTANTS.TICKET_STATUS.OPEN,
        createdBy: user?._id,
        createdByUserType: CONSTANTS.CREATED_BY_USER_TYPE.CONSUMER,
        createdAt: new Date(),
        updatedAt: new Date(),
        priority: CONSTANTS.PRIORITY.HIGH,
        dueDate: new Date(),
        assignee: assignee?._id,
        prescriptionUrl: prescription_url
      })
      await ConsultationModal.create({
        appointmentId: await createAppointmentId(),
        ticket: ticket.id,
        prescriptionUrl: prescription_url,
        status: 'doctor_will_call',
        address,
        userId: user?._id,
        createdAt: new Date()
      })
      const activity = {
        ticket: ticket.id,
        createdAt: new Date(),
        createdByUserType: CONSTANTS.CREATED_BY_USER_TYPE.CONSUMER,
        createdBy: params?.user?._id,
        activity: 'ticket-created'
      }
      await TicketActivitiesModel.create(activity)
      // order.set('prescription.ticketId', ticket.id)
      // await order.save()
      return ticket
    } catch (error) {
      throw error
    }
  }

  async handleDoctorConsultation(data: ConsumerTicketData, params: Params<ConsumerTicketQuery>) {
    try {
      const user = params.user
      const { issue, address, items = [], comment, phoneNumber } = data

      let assignee: any = null

      const supportUsers = await getUsersWithSupportTicketPermission(issue)
      if (supportUsers?.length)
        assignee = new Types.ObjectId(supportUsers[Math.floor(Math.random() * supportUsers.length)])

      const issueParentCategory = getTicketIssueParentCategory(issue)

      const ticket = await TicketsModel.create({
        ticketId: await createTicketId(),
        // order: order.id,
        comment: comment,
        issue,
        issueParentCategory,
        status: CONSTANTS.TICKET_STATUS.OPEN,
        createdBy: user?._id,
        createdByUserType: CONSTANTS.CREATED_BY_USER_TYPE.CONSUMER,
        createdAt: new Date(),
        updatedAt: new Date(),
        priority: CONSTANTS.PRIORITY.HIGH,
        dueDate: new Date(),
        assignee: assignee?._id
      })
      let products = []
      for (const item of items) {
        const product = await ProductsModel.findById(item?.productId).lean()
        if (!product) throw new BadRequest('Product not found')
        products.push(product)
      }
      await ConsultationModal.create({
        appointmentId: await createAppointmentId(),
        ticket: ticket.id,
        status: 'doctor_will_call',
        address,
        userId: user?._id,
        ticketType: 'doctorConsultation',
        createdAt: new Date(),
        medicines: items?.map((item: any) => ({
          productId: item?.productId,
          quantity: item?.quantity,
          note: item?.note || '',
          dosage: {
            timesPerDay: 0,
            noOfDays: 0,
            beforeFood: false,
            afterFood: false,
            morning: false,
            afternoon: false,
            night: false
          }
        })),
        phoneNumber
      })
      const activity = {
        ticket: ticket.id,
        createdAt: new Date(),
        createdByUserType: CONSTANTS.CREATED_BY_USER_TYPE.CONSUMER,
        createdBy: params?.user?._id,
        activity: 'ticket-created'
      }
      await TicketActivitiesModel.create(activity)

      return ticket
    } catch (error) {
      throw error
    }
  }

  async create(data: ConsumerTicketData, params: Params<ConsumerTicketQuery>) {
    try {
      const { issue } = data

      if (issue == 'prescription-upload') {
        return this.handleUploadPrescription(data, params)
      } else if (issue == 'doctor-consultation') {
        return this.handleDoctorConsultation(data, params)
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
