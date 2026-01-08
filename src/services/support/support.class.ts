// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import { Support, SupportData, SupportPatch, SupportQuery, TicketActivitiesModel } from './support.schema'
import { CONSTANTS, TicketsModel } from '../tickets/tickets.schema'
import { BadRequest } from '@feathersjs/errors'
import { Types } from 'mongoose'

export type { Support, SupportData, SupportPatch, SupportQuery }

export interface SupportServiceOptions {
  app: Application
}

export interface SupportParams extends Params<SupportQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class SupportService<ServiceParams extends SupportParams = SupportParams>
  implements ServiceInterface<Support, SupportData, ServiceParams, SupportPatch>
{
  constructor(public options: SupportServiceOptions) {}

  async find(params: any): Promise<any> {
    const {
      user,
      route: { ticketId }
    } = params
    const isFullAccess = true // user?.permissions?.fullAccess

    if (!isFullAccess) {
      const filter = { _id: ticketId, assignee: user._id }
      const userTicket = await TicketsModel.findOne(filter)
      if (!userTicket) throw new BadRequest('TICKET_NOT_FOUND')
    }
    return TicketActivitiesModel.find({ ticket: ticketId }).lean()
  }

  async create(data: SupportData, params: any): Promise<any> {
    const {
      route: { ticketId }
    } = params

    const { user } = params
    const { activity } = data
    const isFullAccess = true // user?.permissions?.fullAccess

    const filter: any = isFullAccess ? {} : { assignee: user._id }
    filter._id = new Types.ObjectId(ticketId)

    const ticket: any = await TicketsModel.findOne(filter).lean()
    if (!ticket) throw new BadRequest('TICKET_NOT_FOUND')

    const attachmentAddedActivity = async () => {
      const attachments = data.attachments
      if (!attachments?.length) throw new BadRequest('ATTACHMENT_NOT_FOUND')

      const ticketAttachments = ticket.attachments ?? []
      ticketAttachments.push(...attachments)
      await TicketsModel.findByIdAndUpdate(ticket._id, { attachments: ticketAttachments })

      const attachmentActivity = {
        ...data,
        ticket: ticket._id,
        createdBy: user._id,
        createdByUserType: CONSTANTS.CREATED_BY_USER_TYPE.SUPER_ADMIN,
        createdAt: new Date()
      }
      return (await TicketActivitiesModel.create(attachmentActivity)).toObject()
    }

    const attachmentRemovedActivity = async () => {
      const attachments = data.attachments
      if (!attachments?.length) throw new BadRequest('ATTACHMENT_NOT_FOUND')

      const removeObjectUrls = attachments.map((a: any) => a.objectUrl)
      let ticketAttachments = ticket.attachments ?? []
      ticketAttachments = ticketAttachments.filter((a: any) => !removeObjectUrls.includes(a.objectUrl))
      await TicketsModel.findByIdAndUpdate(ticket._id, { attachments: ticketAttachments })

      const attachmentActivity = {
        ...data,
        ticket: ticket._id,
        createdBy: user._id,
        createdByUserType: CONSTANTS.CREATED_BY_USER_TYPE.SUPER_ADMIN,
        createdAt: new Date()
      }
      return (await TicketActivitiesModel.create(attachmentActivity)).toObject()
    }

    const assigneeChangedActivity = async () => {
      const { content } = data
      if (!content) throw new BadRequest('ASSIGNEE_NOT_GIVEN')

      await TicketsModel.findByIdAndUpdate(ticket._id, { assignee: new Types.ObjectId(content) })

      const attachmentActivity = {
        ...data,
        ticket: ticket._id,
        createdBy: user._id,
        createdByUserType: CONSTANTS.CREATED_BY_USER_TYPE.SUPER_ADMIN,
        createdAt: new Date()
      }
      return (await TicketActivitiesModel.create(attachmentActivity)).toObject()
    }

    const noteAddedActivity = async () => {
      const { content } = data
      if (!content) throw new BadRequest('NOTE_NOT_ADDED')

      await TicketsModel.findByIdAndUpdate(ticket._id, { content })

      const attachmentActivity = {
        ...data,
        ticket: ticket._id,
        createdBy: user._id,
        createdByUserType: CONSTANTS.CREATED_BY_USER_TYPE.SUPER_ADMIN,
        createdAt: new Date()
      }
      return (await TicketActivitiesModel.create(attachmentActivity)).toObject()
    }

    const dueDateChangedActivity = async () => {
      const { content } = data
      if (!content) throw new BadRequest('DUE_DATE_NOT_SET')

      await TicketsModel.findByIdAndUpdate(ticket._id, { dueDate: new Date(content) })

      const attachmentActivity = {
        ...data,
        ticket: ticket._id,
        createdBy: user._id,
        createdByUserType: CONSTANTS.CREATED_BY_USER_TYPE.SUPER_ADMIN,
        createdAt: new Date()
      }
      return (await TicketActivitiesModel.create(attachmentActivity)).toObject()
    }

    switch (activity) {
      case 'attachment-added':
        return attachmentAddedActivity()
      case 'attachment-removed':
        return attachmentRemovedActivity()
      case 'assignee-changed':
        return assigneeChangedActivity()
      case 'note-added':
        return noteAddedActivity()
      case 'due-date-changed':
        return dueDateChangedActivity()
    }

    return {}
  }

  async remove(id: any): Promise<any> {}
}

export const getOptions = (app: Application) => {
  return { app }
}
