// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import {
  CONSTANTS,
  Tickets,
  TicketsConsumerData,
  TicketsData,
  TicketsModel,
  TicketsPatch,
  TicketsQuery
} from './tickets.schema'
import { OrderModel } from '../order/order.schema'
import { BadRequest } from '@feathersjs/errors'
import { SuperAdminUsersModel } from '../super-admin-users/super-admin-users.schema'
import { getTicketIssueParentCategory } from '../../constants/general'
import moment from 'moment-timezone'
import { TicketActivitiesModel } from '../support/support.schema'
import { Types } from 'mongoose'
import { UsersModel } from '../users/users.schema'
import { ConsultationModal } from '../consultations/consultations.schema'
import { getUsersWithSupportTicketPermission, hasSupportTicketAccess } from '../../cache/redis/permissions'
import { ProductsModel } from '../super-admin/products/products.schema'
import { trackSupportTicketCreated, trackSupportTicketClosed } from '../../analytics/trackers'
import { checkSlotAvailability, convertTo24Hour, reserveSlot } from '../../utils/slots'

export type { Tickets, TicketsData, TicketsPatch, TicketsQuery }

export interface TicketsServiceOptions {
  app: Application
}

export interface TicketsParams extends Params<TicketsQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class TicketsService<ServiceParams extends TicketsParams = TicketsParams>
  implements ServiceInterface<Tickets, TicketsConsumerData, ServiceParams, TicketsPatch>
{
  constructor(public options: TicketsServiceOptions) {}

  async find(_params?: ServiceParams): Promise<Tickets[]> {
    return []
  }

  async get(id: Id, params: any): Promise<any> {
    const { user } = params
    const ticket = await TicketsModel.findById(id).lean()
    if (!ticket) throw new BadRequest('TICKET_NOT_FOUND')

    const order = await OrderModel.findOne({ userId: user._id, _id: ticket.order }).lean()
    if (!order) throw new BadRequest('INVALID_ORDER')

    const ticketActivities = await TicketActivitiesModel.find({ ticket: ticket._id }).lean()
    return {
      ...ticket,
      activities: ticketActivities
    }
  }

  async create(data: TicketsConsumerData, params?: ServiceParams): Promise<any> {
    const user = params?.user
    const {
      order = null,
      issue,
      comment,
      prescription_url = '',
      items = [],
      address,
      patientId,
      phoneNumber,
      dateOfConsult,
      timeOfConsult
    } = data
    return await createConsumerTicket({
      userId: params?.user?._id,
      order,
      issue,
      comment,
      prescription_url,
      items,
      address,
      patientId,
      dateOfConsult,
      timeOfConsult,
      phoneNumber
    })
  }

  async patch(id: NullableId, data: TicketsPatch, _params?: ServiceParams): Promise<any> {
    return {
      id: 0,
      text: `Fallback for ${id}`,
      ...data
    }
  }
}

export class TicketsSuperAdminService<ServiceParams extends TicketsParams = TicketsParams>
  implements ServiceInterface<Tickets, TicketsData, ServiceParams, TicketsPatch>
{
  constructor(public options: TicketsServiceOptions) {}

  async find(params: any): Promise<any> {
    const {
      skip = 0,
      limit = 10,
      status,
      dueDate,
      priority,
      search,
      statusFilter,
      issueFilter,
      dateRange,
      dateFilterType
    } = params.query

    const { user } = params

    const isFullAccess = user?.fullAccess || (await hasSupportTicketAccess(user._id))

    const filter: any = {}

    // 🔒 Enforce assignee restriction if not full access
    if (!isFullAccess) {
      filter.assignee = user._id
    }

    // Date range filter for createdAt
    if (dateRange) {
      const TZ = 'Asia/Kolkata'
      const dr = dateRange
      const startInput = dr.from ?? dr.start ?? dr[0]
      const endInput = dr.to ?? dr.end ?? dr[1]

      const dateMatch: any = {}
      if (startInput) {
        dateMatch.$gte = moment.tz(startInput, TZ).startOf('day').toDate()
      }
      if (endInput) {
        // use $lt next-day start to make the end date inclusive
        dateMatch.$lt = moment.tz(endInput, TZ).add(1, 'day').startOf('day').toDate()
      }

      if (Object.keys(dateMatch).length > 0) {
        filter.createdAt = dateMatch
      }
    }

    // Search optimization
    if (search) {
      const userRegex = new RegExp(search.replace('+', ''), 'i')

      const [orderById, ticketById, matchedConsumers] = await Promise.all([
        OrderModel.findOne({ orderId: search }, '_id').lean(),
        TicketsModel.findOne({ ticketId: search }, 'ticketId').lean(),
        UsersModel.find(
          {
            $or: [{ name: userRegex }, { phoneNumber: userRegex }]
          },
          '_id'
        ).lean()
      ])

      if (orderById) filter.order = orderById._id
      if (ticketById) filter.ticketId = ticketById.ticketId

      if (matchedConsumers?.length) {
        const userIds = matchedConsumers.map((u) => u._id)
        filter.createdBy = { $in: userIds }
      }
    } else {
      if (status) filter.status = status
      if (priority) filter.priority = priority
      if (statusFilter) filter.status = { $in: statusFilter }
      if (issueFilter) filter.issue = { $in: issueFilter }
      if (dueDate) {
        const dueDateMoment = moment.tz(dueDate, 'YYYY-MM-DD HH:mm:ss', 'Asia/Kolkata')
        filter.dueDate = {
          $gte: dueDateMoment.clone().startOf('day').utc().toDate(),
          $lte: dueDateMoment.clone().endOf('day').utc().toDate()
        }
      }
    }

    // Fetch tickets and count in parallel
    const [tickets, documentCount] = await Promise.all([
      TicketsModel.find(filter)
        .populate({
          path: 'order',
          select: '_id orderId createdAt',
          populate: { path: 'userId', select: '_id name' }
        })
        .populate({ path: 'assignee', strictPopulate: false, select: '_id name email phoneNumber' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      TicketsModel.countDocuments(filter)
    ])

    // Prepare user IDs
    const consumerUsersIds: Types.ObjectId[] = []
    const superAdminUsersIds: Types.ObjectId[] = []

    const ticketIds: Types.ObjectId[] = []

    for (const ticket of tickets) {
      ticketIds.push(ticket._id)
      const id = new Types.ObjectId(ticket.createdBy as string)
      if (ticket.createdByUserType === CONSTANTS.CREATED_BY_USER_TYPE.CONSUMER) {
        consumerUsersIds.push(id)
      } else if (ticket.createdByUserType === CONSTANTS.CREATED_BY_USER_TYPE.SUPER_ADMIN) {
        superAdminUsersIds.push(id)
      }
    }

    // Fetch related users and consultations in parallel
    const [consumerUsers, superAdminUsers, consultations] = await Promise.all([
      UsersModel.find({ _id: { $in: consumerUsersIds } })
        .select('_id name')
        .lean(),
      SuperAdminUsersModel.find({ _id: { $in: superAdminUsersIds } })
        .select('_id name')
        .lean(),
      ConsultationModal.find({ ticket: { $in: ticketIds } }).lean()
    ])

    const consumerUserMap = new Map(consumerUsers.map((u) => [u._id.toString(), u]))
    const superAdminUserMap = new Map(superAdminUsers.map((u) => [u._id.toString(), u]))
    const consultationMap = new Map(consultations.map((c) => [c.ticket.toString(), c]))

    // Map data back into tickets
    for (const ticket of tickets) {
      const createdById = ticket.createdBy?.toString()
      if (ticket.createdByUserType === CONSTANTS.CREATED_BY_USER_TYPE.CONSUMER) {
        ticket.createdBy = consumerUserMap.get(createdById) ?? ticket.createdBy
      } else if (ticket.createdByUserType === CONSTANTS.CREATED_BY_USER_TYPE.SUPER_ADMIN) {
        ticket.createdBy = superAdminUserMap.get(createdById) ?? ticket.createdBy
      }

      ;(ticket as any).consultation = consultationMap.get(ticket._id.toString()) ?? null
    }

    return {
      data: tickets,
      total: documentCount,
      limit,
      skip
    }
  }

  async get(id: Id, params: any): Promise<any> {
    const { user } = params
    const isFullAccess = user?.fullAccess || (await hasSupportTicketAccess(user._id))

    const filter: any = isFullAccess ? {} : { assignee: user._id }
    filter._id = id

    const ticket: any = await TicketsModel.findOne(filter)
      .populate({ path: 'assignee', strictPopulate: false, select: '_id name email phoneNumber' })
      .populate({
        path: 'order',
        select: '_id orderId createdAt items prescription address',
        populate: [{ path: 'userId', select: '_id name email phoneNumber' }, { path: 'items.productId' }]
      })
      .populate('patientId')
      .lean()

    if (!ticket) throw new BadRequest('TICKET_NOT_FOUND')

    let createdByDetails = null
    if (ticket.createdByUserType === 'super-admin') {
      createdByDetails = await SuperAdminUsersModel.findById(ticket.createdBy)
        .select('_id name email phoneNumber')
        .lean()
    } else {
      const consumerUser = await UsersModel.findById(ticket?.createdBy).select('-password').lean()
      createdByDetails = consumerUser
    }

    const ticketActivities: any = await TicketActivitiesModel.find({ ticket: ticket._id }).lean()

    const consumerUsersIds = ticketActivities
      .filter((a: any) => a.createdByUserType === CONSTANTS.CREATED_BY_USER_TYPE.CONSUMER)
      .map((a: any) => new Types.ObjectId(a.createdBy))

    const superAdminUsersIds = ticketActivities
      .filter((a: any) => a.createdByUserType === CONSTANTS.CREATED_BY_USER_TYPE.SUPER_ADMIN)
      .map((a: any) => new Types.ObjectId(a.createdBy))

    const consumerUsers = await UsersModel.find({ _id: { $in: consumerUsersIds } })
      .select('_id name')
      .lean()

    const superAdminUsers = await SuperAdminUsersModel.find({ _id: { $in: superAdminUsersIds } })
      .select('_id name')
      .lean()

    for (const activity of ticketActivities) {
      const { createdByUserType, createdBy } = activity
      if (createdByUserType === CONSTANTS.CREATED_BY_USER_TYPE.CONSUMER)
        activity.createdBy = consumerUsers.find((u: any) => u._id.toString() === createdBy) ?? createdBy
      if (createdByUserType === CONSTANTS.CREATED_BY_USER_TYPE.SUPER_ADMIN)
        activity.createdBy = superAdminUsers.find((u: any) => u._id.toString() === createdBy) ?? createdBy
      if (activity.activity === 'assignee-changed') {
        activity.content = await SuperAdminUsersModel.findById(activity.content).select('_id name').lean()
      }
    }

    const consultation = await ConsultationModal.findOne({ ticket: ticket?._id }).select('_id address').lean()

    return {
      ...ticket,
      createdBy: createdByDetails,
      activities: ticketActivities,
      consultation
    }
  }

  async create(data: any, params: any): Promise<any> {
    const { user } = params

    const { order } = data
    const orderDetails = await OrderModel.findById(order).lean()

    if (!orderDetails) throw new BadRequest('ORDER_NOT_FOUND')

    const issueParentCategory = getTicketIssueParentCategory(data.issue)

    const ticket = (
      await TicketsModel.create({
        ...data,
        issueParentCategory,
        ticketId: await createTicketId(),
        assignee: user._id,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user._id,
        createdByUserType: 'super-admin'
      })
    ).toObject()

    const activity = {
      ticket: ticket._id,
      createdAt: new Date(),
      createdByUserType: CONSTANTS.CREATED_BY_USER_TYPE.SUPER_ADMIN,
      createdBy: params?.user?._id,
      activity: 'ticket-created'
    }
    await TicketActivitiesModel.create(activity)

    return ticket
  }

  async patch(id: string, data: any, params?: any): Promise<any> {
    // TODO check authorization
    const { user } = params
    const isFullAccess = user?.fullAccess || (await hasSupportTicketAccess(user._id))

    const filter: any = isFullAccess ? {} : { assignee: user._id }
    filter._id = new Types.ObjectId(id)

    const ticket = await TicketsModel.findOneAndUpdate(filter, data, { returnDocument: 'after' }).lean()

    if (!ticket) throw new BadRequest('Ticket not found!')

    const activityData = {
      ticket: new Types.ObjectId(id),
      createdAt: new Date(),
      createdByUserType: CONSTANTS.CREATED_BY_USER_TYPE.SUPER_ADMIN,
      createdBy: user._id
    }

    let activities = []
    if (data.status) activities.push({ ...activityData, activity: 'status-updated', status: data.status })
    if (data.assignee)
      activities.push({ ...activityData, activity: 'assignee-changed', assignee: data.assignee })

    for (const activity of activities) {
      await TicketActivitiesModel.create(activity)
    }

    if (data?.status === 'closed') {
      // Track Ticket Closed
      const createdAtIST = moment.tz(ticket?.createdAt, 'Asia/Kolkata')
      const nowIST = moment().tz('Asia/Kolkata')

      trackSupportTicketClosed({
        userId: ticket?.createdBy?.toString(),
        ticketId: ticket?.ticketId,
        ticketResolutionTime: nowIST.diff(createdAtIST, 'minutes') + 'Minutes'
      })
    }

    return {}
  }
}

export class TicketsAssigneeService<ServiceParams extends TicketsParams = TicketsParams>
  implements ServiceInterface<Tickets, TicketsData, ServiceParams, TicketsPatch>
{
  constructor(public options: TicketsServiceOptions) {}

  async find(params: any): Promise<any> {
    const ticketId = params.route.ticketId
    const ticket: any = await TicketsModel.findById(ticketId).lean()

    const supportUsers = await getUsersWithSupportTicketPermission(ticket.issue)

    const users: any = await SuperAdminUsersModel.find({
      _id: { $in: supportUsers?.map((u) => new Types.ObjectId(u)) }
    })
      .select('_id name')
      .lean()
    const assignedUserIdx = ticket.assignee
      ? users.findIndex((u: any) => u._id.toString() === ticket.assignee.toString())
      : -1
    if (assignedUserIdx !== -1) users[assignedUserIdx].assigned = true
    return users
  }

  async create(data: any, params: any): Promise<any> {
    // console.log('----- ', data)
  }

  async patch(id: string, data: any, params?: any): Promise<any> {
    // console.log('----- ', data)
  }

  async get(id: Id, params: any): Promise<any> {}
}

export const getOptions = (app: Application) => {
  return { app }
}

export const createTicketId = async () => {
  const timestamp = moment().format('MMYY')
  const prevTotal = await TicketsModel.countDocuments({})

  return 'TKT-' + timestamp + prevTotal
}

export const createAppointmentId = async () => {
  const timestamp = moment().format('MMYY')
  const prevTotal = await ConsultationModal.countDocuments({})

  return 'APPT-' + timestamp + prevTotal
}

export const createConsumerTicket = async (data: {
  userId: any
  order: any
  issue: any
  comment: any
  prescription_url: any
  items: any[]
  address: any
  patientId: any
  dateOfConsult: any
  timeOfConsult: any
  phoneNumber: any
}) => {
  const {
    userId,
    order = null,
    issue,
    comment,
    prescription_url = '',
    items = [],
    address,
    patientId = '',
    dateOfConsult,
    timeOfConsult,
    phoneNumber
  } = data
  const orderDetails = await OrderModel.findOne({ _id: order, userId })

  const convertedStartTime = convertTo24Hour(timeOfConsult)

  await checkSlotAvailability(dateOfConsult, convertedStartTime)

  const issueParentCategory = getTicketIssueParentCategory(issue)

  let assignee: any = null
  const supportUsers = await getUsersWithSupportTicketPermission(issue)
  if (supportUsers?.length)
    assignee = new Types.ObjectId(supportUsers[Math.floor(Math.random() * supportUsers.length)])

  const ticket: any = {
    ticketId: await createTicketId(),
    order: orderDetails?._id,
    comment,
    issue,
    issueParentCategory,
    status: CONSTANTS.TICKET_STATUS.OPEN,
    createdBy: userId,
    createdByUserType: CONSTANTS.CREATED_BY_USER_TYPE.CONSUMER,
    createdAt: new Date(),
    updatedAt: new Date(),
    prescriptionUrl: prescription_url,
    dateOfConsult: dateOfConsult,
    timeOfConsult: timeOfConsult,
    phoneNumber: phoneNumber
  }
  if (patientId) {
    ticket.patientId = patientId
  }
  ticket.priority = CONSTANTS.PRIORITY.HIGH
  ticket.dueDate = new Date()
  ticket.issueParentCategory = issueParentCategory
  ticket.assignee = assignee?._id

  const ticketDoc = (await TicketsModel.create(ticket)).toObject()

  // Track Support Ticker
  trackSupportTicketCreated({
    userId: ticketDoc?.createdBy?.toString(),
    ticketId: ticketDoc?.ticketId,
    issueType: ticketDoc?.issue
  })

  const activity = {
    ticket: ticketDoc._id,
    createdAt: new Date(),
    createdByUserType: CONSTANTS.CREATED_BY_USER_TYPE.CONSUMER,
    createdBy: userId,
    activity: 'ticket-created'
  }
  await TicketActivitiesModel.create(activity)

  let consultationDoc: any
  if (issue == 'prescription-upload') {
    consultationDoc = await ConsultationModal.create({
      appointmentId: await createAppointmentId(),
      ticket: ticketDoc._id,
      prescriptionUrl: prescription_url,
      status: 'doctor_will_call',
      address,
      userId: userId,
      ticketType: 'uploadPrescription',
      createdAt: new Date(),
      ...(patientId ? { patientId } : {}),
      dateOfConsult: dateOfConsult,
      timeOfConsult: timeOfConsult
    })
  }

  if (issue == 'doctor-consultation') {
    let products = []
    for (const item of items) {
      const product = await ProductsModel.findById(item?.productId).lean()
      if (!product) throw new BadRequest('Product not found')
      products.push(product)
    }
    consultationDoc = await ConsultationModal.create({
      appointmentId: await createAppointmentId(),
      ticket: ticketDoc._id,
      status: 'doctor_will_call',
      orderPlaced: !!order,
      orderId: orderDetails?._id,
      address,
      userId: userId,
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
      ...(patientId ? { patientId } : {}),
      dateOfConsult: dateOfConsult,
      timeOfConsult: timeOfConsult,
      phoneNumber: phoneNumber
    })
  }

  await reserveSlot(dateOfConsult, convertedStartTime, consultationDoc._id)

  return ticketDoc
}
