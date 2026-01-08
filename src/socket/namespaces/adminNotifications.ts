import { app } from '../../app'
import { NotificationsClass } from '../../utils/classes/NotificationClass'
import SocketUserManager from '../../utils/classes/SocketUserManager'

export const adminNotifications = (namespace: any) => {
  namespace.on('connection', (socket: any) => {
    // console.log(`User connected to adminNotification: ${socket.id}`)
    const user = socket?.handshake?.query?.user
    SocketUserManager.registerSocket('adminNotifications', user?._id?.toString(), socket.id)

    // Listen to a notification event
    socket.on('notification', (data: any) => {
      // console.log(`User Notification:`, data)
      socket.broadcast.emit('notification', data)
    })

    // Listen for bulk upload start event
    socket.on('start_bulk_upload', async (data: any) => {
      try {
        console.log('Starting bulk upload for user:', user?._id)

        // Import the bulk upload service
        const { BulkUploadZipCodesService } = await import('../../services/zip-codes/zip-codes.class')
        const bulkUploadService = new BulkUploadZipCodesService()

        // Process the bulk upload with socket context
        const results = await bulkUploadService.create(data, {
          app: app,
          user: user,
          socket: socket // Pass socket instance for direct emission
        })

        // Emit completion event
        socket.emit('bulk_upload_complete', {
          type: 'bulk_upload_complete',
          data: results
        })
      } catch (error: any) {
        console.error('Bulk upload error:', error)
        // Emit error event
        socket.emit('bulk_upload_error', {
          type: 'bulk_upload_error',
          error: error.message
        })
      }
    })

    socket.on('start_store_bulk_upload', async (data: any) => {
      try {
        console.log('Starting store bulk upload for user:', user?._id)

        const { BulkUploadStoresService } = await import('../../services/stores/stores.class')
        const bulkUploadService = new BulkUploadStoresService()

        const results = await bulkUploadService.create(data, {
          app: app,
          user: user,
          socket: socket
        })

        socket.emit('store_bulk_upload_complete', {
          type: 'store_bulk_upload_complete',
          data: results
        })
      } catch (error: any) {
        console.error('Store bulk upload error:', error)
        socket.emit('store_bulk_upload_error', {
          type: 'store_bulk_upload_error',
          error: error?.message || 'Failed to process store bulk upload'
        })
      }
    })

    socket.on('start_delivery_policy_bulk_upload', async (data: any) => {
      try {
        console.log('Starting delivery policy bulk upload for user:', user?._id)

        const { BulkUploadDeliveryPoliciesService } = await import(
          '../../services/delivery-policies/delivery-policies.class'
        )
        const bulkUploadService = new BulkUploadDeliveryPoliciesService()

        const results = await bulkUploadService.create(data, {
          app: app,
          user: user,
          socket: socket
        })

        socket.emit('delivery_policy_bulk_upload_complete', {
          type: 'delivery_policy_bulk_upload_complete',
          data: results
        })
      } catch (error: any) {
        console.error('Delivery policy bulk upload error:', error)
        socket.emit('delivery_policy_bulk_upload_error', {
          type: 'delivery_policy_bulk_upload_error',
          error: error?.message || 'Failed to process delivery policy bulk upload'
        })
      }
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      // console.log(`User disconnected from adminNotification: ${socket.id}`)
      SocketUserManager.removeSocket('adminNotifications', socket?.id)
    })
  })
  // console.log('add user notification')
  const adminNotificationService = new NotificationsClass(namespace, 'adminNotifications')
  adminNotificationService.processNotificationQueue()
  return adminNotificationService
}
