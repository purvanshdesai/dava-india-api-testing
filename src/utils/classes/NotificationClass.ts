import Redis from 'ioredis'

import { appConfig, redisConfig } from '../../utils/config'
import { Worker, Queue } from 'bullmq'
import { NotificationsModal } from '../../services/notifications/notifications.schema'
import SocketUserManager from './SocketUserManager'

const config = appConfig.redis

const redis = new Redis({
  host: config.host,
  port: config.port
})
// const notificationQueue = new Queue('notificationsQueue', { connection: redisConfig })

export class NotificationsClass {
  socketServer: any
  namespace: string
  notificationQueue: any
  constructor(socketServer: any, namespace: string) {
    this.socketServer = socketServer
    this.namespace = namespace
    this.notificationQueue = new Queue(`notificationsQueue${this.namespace}`, { connection: redisConfig })
  }

  async enqueueNotification(payload: any) {
    try {
      await this.notificationQueue.add(`sendNotification`, payload)
      // const notificationPayload = payload
      // console.log('Processing notification:', notificationPayload)

      // const liveUsers: any = await this.getLiveUsers(notificationPayload.userId)

      // if (liveUsers && liveUsers.length > 0) {
      //   this.notifyLiveUsers(notificationPayload, liveUsers)
      // }

      // await this.saveNotificationToDatabase(notificationPayload)
    } catch (error) {
      console.error('Error in enqueueNotification:', error)
    }
  }

  async sendNotification(payload: any) {
    try {
      console.log('Adding notification to queue:', payload)
      await this.enqueueNotification(payload)
    } catch (error) {
      console.error('Error in sendNotification:', error)
    }
  }

  async sendNotificationToUser(userId: string, payload: any) {
    try {
      const userSocketIds = SocketUserManager.getSocketsForUser(this.namespace, userId)

      const notification = await this.saveNotificationToDatabase(payload)
      this.notifyLiveUsers(notification, userSocketIds)
    } catch (error) {
      console.log('Error while sending notification to user ====', error)
    }
  }

  async getLiveUsers(userId: string) {
    // const sockets: any = await this.socketServer.fetchSockets()
    // return sockets.map((socket: any) => socket.id)
    const allConnectedSocketIds = []
    const namespaceUsers = SocketUserManager.getAllUsersInNamespace(this.namespace)
    for (const namespaceUser of namespaceUsers) {
      const userSockets = SocketUserManager.getSocketsForUser(this.namespace, namespaceUser as string)
      allConnectedSocketIds.push(...userSockets)
    }
    return allConnectedSocketIds
  }

  notifyLiveUsers(notificationPayload: any, liveUsers: any) {
    liveUsers.forEach((socketId: any) => {
      this.socketServer.to(socketId).emit('new_notification', notificationPayload)
    })
  }

  async saveNotificationToDatabase(notificationPayload: any) {
    try {
      const notification = await NotificationsModal.create({
        ...notificationPayload,
        message: notificationPayload?.message ?? '-'
      })
      return notification
    } catch (error) {
      console.error('Error in saveNotificationToDatabase:', error)
    }
  }
  async processNotificationQueue() {
    const worker = new Worker(
      `notificationsQueue${this.namespace}`,
      async (job) => {
        const notificationPayload = job.data

        const liveUsers: any = await this.getLiveUsers(notificationPayload.userId)

        const notification = await this.saveNotificationToDatabase(notificationPayload)
        // console.log('live users', liveUsers)
        if (liveUsers && liveUsers.length > 0) {
          // console.log('sent data')
          this.notifyLiveUsers(notification, liveUsers)
        }
      },
      { connection: redisConfig }
    )

    worker.on('completed', (job) => {
      console.log(`Notification processed successfully: ${job.id}`)
    })

    worker.on('failed', (job: any, err) => {
      console.error(`Notification processing failed for ${job.id}:`, err.message)
    })
  }

  async find() {}

  async get() {}

  async create() {}

  // This method has to be added to the 'methods' option to make it available to clients
  async update() {}

  async patch() {}

  async remove() {}
}
