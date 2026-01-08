// // For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve } from '@feathersjs/schema'
import { ObjectIdSchema, StringEnum, Type, getValidator, querySyntax } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { NotificationsService } from './notifications.class'
import { ModelObjectId } from '../../utils'
import { makeMongooseModel, typeboxToMongooseSchema } from '../../utils/mongoose'

// Main data model schema
export const notificationsSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    recipientId: ModelObjectId({ mongoose: { ref: 'users', required: true } }),
    recipientType: StringEnum(['user', 'admin']),
    title: Type.String({ mongoose: { required: true } }),
    message: Type.Optional(Type.String()),
    type: Type.String({ mongoose: { required: true } }),
    data: Type.Any(),
    isRead: Type.Boolean({ mongoose: { default: false } }),
    createdAt: Type.String({ format: 'date-time' }),
    priority: StringEnum(['low', 'normal', 'high']),
    controller: Type.String()
  },
  { $id: 'Notifications', additionalProperties: false }
)
export type Notifications = Static<typeof notificationsSchema>
export const notificationsValidator = getValidator(notificationsSchema, dataValidator)
export const notificationsResolver = resolve<Notifications, HookContext<NotificationsService>>({})

export const notificationsExternalResolver = resolve<Notifications, HookContext<NotificationsService>>({})

// Schema for creating new entries
export const notificationsDataSchema = Type.Pick(notificationsSchema, [], {
  $id: 'NotificationsData'
})
export type NotificationsData = Static<typeof notificationsDataSchema>
export const notificationsDataValidator = getValidator(notificationsDataSchema, dataValidator)
export const notificationsDataResolver = resolve<Notifications, HookContext<NotificationsService>>({})

// Schema for updating existing entries
export const notificationsPatchSchema = Type.Partial(notificationsSchema, {
  $id: 'NotificationsPatch'
})
export type NotificationsPatch = Static<typeof notificationsPatchSchema>
export const notificationsPatchValidator = getValidator(notificationsPatchSchema, dataValidator)
export const notificationsPatchResolver = resolve<Notifications, HookContext<NotificationsService>>({})

// Schema for allowed query properties
export const notificationsQueryProperties = Type.Pick(notificationsSchema, ['_id', 'controller'])
export const notificationsQuerySchema = Type.Intersect(
  [
    querySyntax(notificationsQueryProperties),
    // Add additional query properties here
    Type.Object({}, { additionalProperties: false })
  ],
  { additionalProperties: false }
)
export type NotificationsQuery = Static<typeof notificationsQuerySchema>
export const notificationsQueryValidator = getValidator(notificationsQuerySchema, queryValidator)
export const notificationsQueryResolver = resolve<NotificationsQuery, HookContext<NotificationsService>>({})

export const NotificationsDb = Type.Omit(notificationsSchema, ['_id', 'controller'], {
  $id: 'NotificationsDb'
})

const mongooseSchema = typeboxToMongooseSchema(NotificationsDb)

export const NotificationsModal = makeMongooseModel('notifications', mongooseSchema)
