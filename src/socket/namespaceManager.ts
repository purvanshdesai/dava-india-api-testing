import { socketAuth } from '../utils'
// import { NotificationsClass } from '../utils/classes/NotificationClass'
import SocketUserManager from '../utils/classes/SocketUserManager'
import { adminNotifications } from './namespaces/adminNotifications'
import { storeNotifications } from './namespaces/storeNotifications'
import { userNotifications } from './namespaces/userNotifications'

export const allowedNamespaces = ['userNotifications', 'adminNotifications', 'storeNotifications']

const namespaceMap: any = {
  userNotifications: userNotifications,
  adminNotifications: adminNotifications,
  storeNotifications: storeNotifications
}
// type TNotificationServices = {
//   userNotifications: NotificationsClass | null
//   adminNotifications: NotificationsClass | null
//   storeNotifications: NotificationsClass | null
// }
export const notificationServices: any = {
  userNotifications: null,
  adminNotifications: null,
  storeNotifications: null
}

export default (io: any) => {
  for (const item of allowedNamespaces) {
    const namespace = io.of(`/${item}`)
    // console.log(`📡 Setting up namespace: /${item}`)

    namespace.use(socketAuth)
    SocketUserManager.createNamespace(item)
    const namespaceInitializer = namespaceMap[item]
    const notificationService: any = namespaceInitializer(namespace)
    notificationServices[item] = notificationService

    // Add connection event logging
    namespace.on('connection', (socket: any) => {
      // console.log(`✅ Client connected to namespace: /${item}`, {
      //   socketId: socket.id,
      //   userId: socket.handshake.query.user?._id || 'unknown'
      // })

      socket.on('disconnect', (reason: any) => {
        // console.log(`❌ Client disconnected from namespace: /${item}`, {
        //   socketId: socket.id,
        //   reason
        // })
      })
    })
  }
  // const namespace = io.of('/userNotifications')
  // SocketUserManager.createNamespace('userNotifications')
  // userNotifications(namespace)
}
