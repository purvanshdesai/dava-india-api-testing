// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import {
  NotificationsModal,
  type Notifications,
  type NotificationsData,
  type NotificationsPatch,
  type NotificationsQuery
} from './notifications.schema'

import Redis from 'ioredis'

import { appConfig } from '../../utils/config'
import { Worker, Queue } from 'bullmq'
import { excludeFieldsInObject } from '../../utils'

const config = appConfig.redis

const redis = new Redis({
  host: config.host,
  port: config.port
})
const notificationQueue = new Queue('notificationsQueue', { connection: config })

export type { Notifications, NotificationsData, NotificationsPatch, NotificationsQuery }

export interface NotificationsServiceOptions {
  app: Application
}

export interface NotificationsParams extends Params<NotificationsQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class NotificationsService {
  constructor() {}

  async find(params: Params<NotificationsQuery>) {
    try {
      const query = params.query
      const user = params.user
      const baseQuery = excludeFieldsInObject(['$limit', '$skip', '$sort'], query)
      const notifications = await NotificationsModal.find({
        ...baseQuery,
        recipientId: user?._id
      })
        .lean()
        .sort({
          _id: -1
        })
        .limit(query?.$limit || 0)
        .skip(query?.$skip || 0)
      const notificationCount = await NotificationsModal.countDocuments({
        ...baseQuery,
        recipientId: user?._id
      })

      return {
        data: notifications,
        total: notificationCount
      }
    } catch (error) {
      throw error
    }
  }

  async get() {}

  async create() {}

  // This method has to be added to the 'methods' option to make it available to clients
  async update() {}

  async patch(id: Id, data: NotificationsPatch, params: Params<NotificationsQuery>) {
    try {
      const user = params.user
      const query = params.query
      if (query?.controller == 'markAllAsRead') {
        await NotificationsModal.updateMany({ recipientId: user?._id }, { isRead: true })
        return {
          message: 'Marked all as read'
        }
      }
      const notification = await NotificationsModal.findByIdAndUpdate(
        id,
        { ...data },
        { returnDocument: 'after', new: true }
      ).lean()
      return notification
    } catch (error) {
      throw error
    }
  }

  async remove() {}
}

export const getOptions = (app: Application) => {
  return { app }
}
