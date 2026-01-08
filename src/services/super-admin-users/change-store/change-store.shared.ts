// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import { BadRequest } from '@feathersjs/errors'
import { OrderItemTrackingModal } from '../../order-item-tracking/order-item-tracking.schema'
import type {
  SuperAdminUsersChangeStore,
  SuperAdminUsersChangeStoreData,
  SuperAdminUsersChangeStorePatch,
  SuperAdminUsersChangeStoreQuery,
  SuperAdminUsersChangeStoreService
} from './change-store.class'
import { releaseOrderSoftHold, softHoldForOrder } from '../../../utils/inventory'
import { AppDataModel, CONSTANTS } from '../../app-data/app-data.schema'
import { StoreAdminUserModal } from '../../store-admin-users/store-admin-users.schema'
import { notificationServices } from '../../../socket/namespaceManager'
import moment from 'moment'
import { OrderItemModel } from '../../order-items/order-items.schema'
import { StoreModel } from '../../stores/stores.schema'

export type {
  SuperAdminUsersChangeStore,
  SuperAdminUsersChangeStoreData,
  SuperAdminUsersChangeStorePatch,
  SuperAdminUsersChangeStoreQuery
}

export const superAdminUsersChangeStorePath = 'super-admin-users/change-store'
export const superAdminUsersPartialTransferPath = 'super-admin-users/partial-transfer'

export const superAdminUsersChangeStoreMethods: Array<keyof SuperAdminUsersChangeStoreService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const handleStoreChanges = async ({
  order,
  store,
  data,
  params
}: {
  order: any
  store: any
  data: any
  params: any
}) => {
  const { currentStoreId: transferringFromStoreId, transferredStoreId: transferringToStoreId } = data
  const user = params?.user ?? {}

  const orderTracking: any = await OrderItemTrackingModal.findOne({
    order: order._id,
    store: transferringFromStoreId,
    isDeleted: { $ne: true }
  })
    .populate('items')
    .lean()

  const [fromStore, toStore] = await Promise.all([
    StoreModel.findById(transferringFromStoreId, '_id name storeCode').lean(),
    StoreModel.findById(transferringToStoreId, '_id name storeCode').lean()
  ])

  if (!orderTracking) throw new BadRequest('Order tracking not found for the item your trying to transfer!')

  if (orderTracking.timeline?.find((t: any) => t.statusCode === 'dispatched'))
    throw new BadRequest('Dispatched order can not be transferred')

  const storeChangeActivity = await AppDataModel.findOne({
    type: CONSTANTS.TYPE.TRACKING_STATUS,
    statusCode: 'order_transferred_to_another_shop'
  }).lean()

  const cancelReason = await AppDataModel.findOne({
    type: CONSTANTS.TYPE.STORE_TRANSFER_REASON,
    statusCode: data?.cancelReason
  }).lean()

  // Fetch all available Trackings
  const availableTrackingsForOrder: any = await OrderItemTrackingModal.find({
    order: order._id,
    isDeleted: { $ne: true }
  })
    .select('_id store timeline')
    .lean()

  // console.log('availableTrackingsForOrder ===>', availableTrackingsForOrder)

  // Check if transferringToStoreId available in Trackings
  const existingStoreTrackingAvailable = availableTrackingsForOrder?.find(
    (t: any) => t.store?.toString() === transferringToStoreId
  )

  // console.log('existingStoreTrackingAvailable ===>', existingStoreTrackingAvailable)

  // If available, move item from old Tracking to selected Tracking in items field
  if (existingStoreTrackingAvailable) {
    if (existingStoreTrackingAvailable?.timeline?.find((t: any) => t.statusCode === 'dispatched'))
      throw new BadRequest('Dispatched order can not be transferred')

    await releaseOrderSoftHold({ orderTrackingId: existingStoreTrackingAvailable._id })

    let newActivity = {
      label: `Order Transfered from ${fromStore?.storeCode} to ${toStore?.storeCode}`,
      date: new Date(),
      authorName: user?.name,
      authorId: user?._id.toString(),
      comment: `${cancelReason?.name ?? data?.cancelReason} - ${data?.comment}`, // TODO save change store note and cancel reason here
      statusCode: storeChangeActivity?.statusCode,
      previousStoreId: orderTracking.store
    }

    await OrderItemTrackingModal.findOneAndUpdate(
      { _id: existingStoreTrackingAvailable?._id, isDeleted: { $ne: true } },
      {
        $push: { timeline: newActivity, items: orderTracking?.items }
      }
    )

    // Update order item trackingItemId
    await OrderItemModel.updateMany(
      { order: order._id, _id: { $in: orderTracking?.items } },
      { orderTracking: existingStoreTrackingAvailable?._id }
    )

    await softHoldForOrder({ orderTrackingId: existingStoreTrackingAvailable._id })

    // Finally delete order tracking once moved
    await OrderItemTrackingModal.deleteOne({ _id: orderTracking?._id, isDeleted: { $ne: true } })
  } else {
    await releaseOrderSoftHold({ orderTrackingId: orderTracking._id })

    const newActivity = {
      label: `Order Transfered from ${fromStore?.storeCode} to ${toStore?.storeCode}`,
      date: new Date(),
      authorName: user?.name,
      authorId: user?._id.toString(),
      comment: `${cancelReason?.name ?? data?.cancelReason} - ${data?.comment}`, // TODO save change store note and cancel reason here
      statusCode: storeChangeActivity?.statusCode,
      previousStoreId: orderTracking.store
    }

    await OrderItemTrackingModal.findOneAndUpdate(
      { _id: orderTracking?._id, isDeleted: { $ne: true } },
      {
        store: store?._id,
        $push: { timeline: newActivity },
        lastTimelineStatus: storeChangeActivity?.statusCode
      }
    )

    await softHoldForOrder({ orderTrackingId: orderTracking._id })
  }
  const storeUsers = await StoreAdminUserModal.find({ storeIds: store?._id }).lean()

  for (const storeUser of storeUsers) {
    notificationServices.adminNotifications.sendNotificationToUser(storeUser?._id, {
      recipientId: storeUser?._id,
      recipientType: 'admin',
      title: 'Order Shift',
      message: 'an order has been shifted to your store',
      type: 'order',
      data: {},
      isRead: false,
      createdAt: moment().toDate(),
      priority: 'normal'
    })
  }

  return {
    message: 'Changed store'
  }
}
