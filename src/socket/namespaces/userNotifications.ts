import { NotificationsClass } from '../../utils/classes/NotificationClass'
import SocketUserManager from '../../utils/classes/SocketUserManager'

// export let userNotificationService: NotificationsClass | null = null

export const userNotifications = (namespace: any): NotificationsClass => {
  namespace.on('connection', (socket: any) => {
    console.log(`User connected to userNotifications: ${socket.id}`)
    const user = socket?.handshake?.query?.user
    SocketUserManager.registerSocket('userNotifications', user?._id?.toString(), socket.id)
    // Listen to a notification event
    socket.on('notification', (data: any) => {
      console.log(`User Notification:`, data)
      socket.broadcast.emit('notification', data)
    })
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected from userNotifications: ${socket.id}`)
      SocketUserManager.removeSocket('userNotifications', socket?.id)
    })
  })
  console.log('add user notification')
  const userNotificationService = new NotificationsClass(namespace, 'userNotifications')
  userNotificationService.processNotificationQueue()
  return userNotificationService
}
