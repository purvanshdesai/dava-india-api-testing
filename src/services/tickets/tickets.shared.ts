// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import {
  Tickets,
  TicketsAssigneeService,
  TicketsData,
  TicketsPatch,
  TicketsQuery,
  TicketsService,
  TicketsSuperAdminService
} from './tickets.class'

export type { Tickets, TicketsData, TicketsPatch, TicketsQuery }

export type TicketsClientService = Pick<TicketsService<Params<TicketsQuery>>, (typeof ticketsMethods)[number]>

export const ticketsPath = 'tickets'
export const ticketsSuperAdminPath = 'support/tickets'
export const ticketsAssigneePath = 'support/tickets/:ticketId/assignee'

export const ticketsMethods: Array<keyof TicketsService> = ['find', 'get', 'create', 'patch']
export const ticketsSuperAdminMethods: Array<keyof TicketsSuperAdminService> = [
  'find',
  'get',
  'create',
  'patch'
]
export const ticketsAssigneeMethods: Array<keyof TicketsAssigneeService> = ['find', 'create', 'patch']

export const ticketsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(ticketsPath, connection.service(ticketsPath), {
    methods: ticketsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [ticketsPath]: TicketsClientService
  }
}

export const SUPPORTED_TICKET_ISSUE_TYPES = {
  PRESCRIPTION_UPLOAD: 'prescription-upload',
  DOCTOR_CONSULTATION: 'doctor-consultation',
  RETURN_DAMAGED_PRODUCT: 'damaged-product',
  RETURN_WRONG_ITEM: 'wrong-item',
  RETURN_EXPIRED: 'expired',
  CANCEL_ADMIN_PARTIAL_CANCEL_REQUEST: 'admin-partial-order-cancellation-request'
}

const getIssueLabel = (issue: string): string => {
  const issueLabels: Record<string, string> = {
    'order-not-delivered': 'Order not delivered',
    'late-delivery': 'Late delivery',
    'wrong-medicine-delivered': 'Wrong medicine delivered',
    'order-cancellation-request': 'Order cancellation request',
    'lost-or-missing-item-in-delivery': 'Lost or missing item in delivery',
    'prescription-upload': 'Prescription upload',
    'doctor-consultation': 'Doctor consultation',
    'damaged-product': 'In transit damaged',
    'wrong-item': 'Received items different from the order placed',
    expired: 'Received nearby or expired product',
    'admin-partial-order-cancellation-request': 'Admin Partial cancellation request'
  }
  return issueLabels[issue] || issue
}

const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0
  const dob = new Date(dateOfBirth)
  const now = new Date()

  let age = now.getFullYear() - dob.getFullYear()
  const hasHadBirthdayThisYear =
    now.getMonth() > dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate())

  if (!hasHadBirthdayThisYear) {
    age--
  }

  return age
}

const formatDate = (date: string): string => {
  if (!date) return '--'
  const moment = require('moment-timezone')
  return moment(date).tz('Asia/Kolkata').format('DD/MM/YYYY HH:mm:ss')
}

export const exportTickets = async (filters: any): Promise<any[]> => {
  try {
    console.time('Export Tickets time')
    const { TicketsModel } = await import('./tickets.schema')
    const { TicketActivitiesModel } = await import('../support/support.schema')
    const moment = require('moment-timezone')
    const TZ = 'Asia/Kolkata'

    // Build aggregation pipeline
    const pipeline: any[] = []
    const columnFilters = filters?.columnFilters || []

    // Build match stage based on filters
    const matchStage: any = {}

    // Date range filter
    if (filters?.dateRange) {
      const dr = filters.dateRange
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
        matchStage.createdAt = dateMatch
      }
    }

    // Column filters
    for (const filter of columnFilters) {
      if (filter.id === 'status' && filter.value) {
        const statusValues = Array.isArray(filter.value) ? filter.value : [filter.value]
        matchStage.status = { $in: statusValues }
      } else if (filter.id === 'issue' && filter.value) {
        const issueValues = Array.isArray(filter.value) ? filter.value : [filter.value]
        matchStage.issue = { $in: issueValues }
      } else if (filter.id === 'ticketId' && filter.value) {
        // Search by ticket ID
        const searchValue = filter.value
        matchStage.ticketId = { $regex: searchValue, $options: 'i' }
      }
    }

    // Add match stage if there are filters
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage })
    }

    // Sort by most recent first
    pipeline.push({ $sort: { _id: -1 } })

    // Limit to prevent excessive data (optional: can be increased or made configurable)
    pipeline.push({ $limit: 50000 })

    // Lookup order details - only get fields we need
    pipeline.push({
      $lookup: {
        from: 'orders',
        localField: 'order',
        foreignField: '_id',
        pipeline: [{ $project: { orderId: 1, createdAt: 1 } }],
        as: 'order'
      }
    })
    pipeline.push({ $unwind: { path: '$order', preserveNullAndEmptyArrays: true } })

    // Add field to convert createdBy string to ObjectId if needed
    pipeline.push({
      $addFields: {
        createdByObjectId: {
          $cond: {
            if: { $eq: [{ $type: '$createdBy' }, 'objectId'] },
            then: '$createdBy',
            else: { $toObjectId: '$createdBy' }
          }
        },
        assigneeObjectId: {
          $cond: {
            if: { $eq: [{ $type: '$assignee' }, 'objectId'] },
            then: '$assignee',
            else: null
          }
        },
        assigneeOriginal: '$assignee'
      }
    })

    // Lookup created by - check users first, then admins
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'createdByObjectId',
        foreignField: '_id',
        pipeline: [{ $project: { name: 1 } }],
        as: 'createdByUser'
      }
    })
    pipeline.push({
      $lookup: {
        from: 'super-admin-users',
        localField: 'createdByObjectId',
        foreignField: '_id',
        pipeline: [{ $project: { name: 1 } }],
        as: 'createdByAdmin'
      }
    })

    // Lookup patient details - only necessary fields
    pipeline.push({
      $lookup: {
        from: 'patients',
        localField: 'patientId',
        foreignField: '_id',
        pipeline: [{ $project: { name: 1, relation: 1, gender: 1, dateOfBirth: 1, phoneNumber: 1 } }],
        as: 'patientId'
      }
    })
    pipeline.push({ $unwind: { path: '$patientId', preserveNullAndEmptyArrays: true } })

    // Lookup assignee details - only if assignee is an ObjectId
    pipeline.push({
      $lookup: {
        from: 'super-admin-users',
        localField: 'assigneeObjectId',
        foreignField: '_id',
        pipeline: [{ $project: { name: 1 } }],
        as: 'assigneeUser'
      }
    })
    pipeline.push({ $unwind: { path: '$assigneeUser', preserveNullAndEmptyArrays: true } })

    // Project final fields without activities (we'll fetch them separately in batches)
    pipeline.push({
      $project: {
        ticketId: 1,
        createdAt: 1,
        dueDate: 1,
        status: 1,
        issue: 1,
        phoneNumber: 1,
        editedDateOfBirth: 1,
        orderId: '$order.orderId',
        orderCreatedAt: '$order.createdAt',
        createdByName: {
          $ifNull: [
            { $arrayElemAt: ['$createdByUser.name', 0] },
            { $arrayElemAt: ['$createdByAdmin.name', 0] }
          ]
        },
        patientName: '$patientId.name',
        patientRelation: '$patientId.relation',
        patientGender: '$patientId.gender',
        patientDob: '$patientId.dateOfBirth',
        patientPhone: '$patientId.phoneNumber',
        assigneeName: {
          $cond: {
            if: { $ne: ['$assigneeUser', null] },
            then: '$assigneeUser.name',
            else: {
              $cond: {
                if: { $eq: [{ $type: '$assigneeOriginal' }, 'string'] },
                then: '$assigneeOriginal',
                else: null
              }
            }
          }
        }
      }
    })

    // Execute aggregation
    const tickets = await TicketsModel.aggregate(pipeline)

    // Fetch activities separately for all tickets in one query (more efficient)

    const ticketIds = tickets.map((t: any) => t._id)

    // Limit activities to prevent memory issues (max 10 activities per ticket)
    // If you have 50k tickets, this limits to 500k activities max
    const activities = await TicketActivitiesModel.find(
      {
        ticket: { $in: ticketIds }
      },
      { ticket: 1, content: 1, createdAt: 1, createdBy: 1, activity: 1 }
    )
      .sort({ createdAt: 1 })
      .limit(500000) // Hard limit to prevent memory overflow
      .lean()

    // Get all unique creator IDs from activities
    const creatorIds = [...new Set(activities.map((a: any) => a.createdBy?.toString()).filter(Boolean))]

    // Fetch users and admins for all creators
    const { UsersModel } = await import('../users/users.schema')
    const { SuperAdminUsersModel } = await import('../super-admin-users/super-admin-users.schema')

    const [users, admins] = await Promise.all([
      UsersModel.find({ _id: { $in: creatorIds } }, { _id: 1, name: 1 }).lean(),
      SuperAdminUsersModel.find({ _id: { $in: creatorIds } }, { _id: 1, name: 1 }).lean()
    ])

    // Create a map of userId -> name
    const creatorNamesMap: Record<string, string> = {}
    users.forEach((user: any) => {
      creatorNamesMap[user._id.toString()] = user.name
    })
    admins.forEach((admin: any) => {
      creatorNamesMap[admin._id.toString()] = admin.name
    })

    // Group activities by ticket
    const activitiesByTicket = activities.reduce((acc: any, activity: any) => {
      const ticketId = activity.ticket.toString()
      if (!acc[ticketId]) {
        acc[ticketId] = []
      }
      acc[ticketId].push(activity)
      return acc
    }, {})
    // Format tickets for export
    const exportData = tickets.map((ticket: any) => {
      const dateOfBirth = ticket.editedDateOfBirth || ticket.patientDob
      const age = dateOfBirth ? calculateAge(dateOfBirth) : '--'

      // Format activities/notes (limit to latest 20 per ticket to prevent Excel cell overflow)
      const ticketActivities = activitiesByTicket[ticket._id.toString()] || []
      const limitedActivities = ticketActivities.slice(-20) // Only last 20 activities
      const notes = limitedActivities
        .map((activity: any) => {
          const date = moment(activity.createdAt).tz('Asia/Kolkata').format('DD/MM/YYYY HH:mm')
          const creatorId = activity.createdBy?.toString()
          const author = creatorNamesMap[creatorId] || 'Unknown'
          return `[${date}] ${author}: ${activity.activity} - ${activity.content || ''}`
        })
        .join('\n')

      return {
        'Ticket No': ticket.ticketId || '--',
        'Ticket Date': formatDate(ticket.createdAt),
        'Due Date': formatDate(ticket.dueDate),
        'Order No': ticket.orderId || '--',
        'Order Date': ticket.orderCreatedAt ? formatDate(ticket.orderCreatedAt) : '--',
        'Raised By': ticket.createdByName || '--',
        Status: ticket.status || '--',
        Reason: getIssueLabel(ticket.issue),
        'Patient Name': ticket.patientName || '--',
        Relation: ticket.patientRelation || '--',
        'Patient Gender': ticket.patientGender || '--',
        'Patient Age': age.toString(),
        'Phone Number': ticket.phoneNumber || ticket.patientPhone || '--',
        Assignee: ticket.assigneeName || '--',
        'Notes Added': notes || ''
      }
    })

    console.timeEnd('Export Tickets time')

    // Clear large objects from memory
    tickets.length = 0
    activities.length = 0

    return exportData
  } catch (error) {
    console.error('Error exporting tickets:', error)
    // Log memory usage on error
    const used = process.memoryUsage()
    console.error('Memory usage:', {
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`
    })
    throw new Error('Failed to export tickets')
  }
}
