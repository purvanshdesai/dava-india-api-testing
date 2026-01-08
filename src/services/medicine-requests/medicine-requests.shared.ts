// For more information about this file see https://dove.feathersjs.com/guides/cli/service.shared.html
import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type {
  MedicineRequests,
  MedicineRequestsData,
  MedicineRequestsPatch,
  MedicineRequestsQuery,
  MedicineRequestsService
} from './medicine-requests.class'
import moment from 'moment'
import { MedicineRequestsModel } from './medicine-requests.schema'

export type { MedicineRequests, MedicineRequestsData, MedicineRequestsPatch, MedicineRequestsQuery }

export type MedicineRequestsClientService = Pick<
  MedicineRequestsService<Params<MedicineRequestsQuery>>,
  (typeof medicineRequestsMethods)[number]
>

export const medicineRequestsPath = 'medicine-requests'
export const medicineRequestsAdminPath = 'admin/medicine-requests'

export const medicineRequestsMethods: Array<keyof MedicineRequestsService> = [
  'find',
  'get',
  'create',
  'patch',
  'remove'
]

export const medicineRequestsClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(medicineRequestsPath, connection.service(medicineRequestsPath), {
    methods: medicineRequestsMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [medicineRequestsPath]: MedicineRequestsClientService
  }
}

export const generateRunningRequestNo = async () => {
  const timestamp = moment().format('MMYY')
  const prevTotal = await MedicineRequestsModel.countDocuments({})

  return timestamp + prevTotal
}

interface MedicineRequestRow {
  'Request Number': string
  'Medicine Name': string
  'Requested Date': string
  'User Name': string
  'User Email': string
  'User Phone': string
  'Status': string
  'Notes': string
}

export const exportMedicineRequests = async (filters: any): Promise<any[]> => {
  try {
    console.time('Export Medicine Requests time')
    const TZ = 'Asia/Kolkata'

    const buildRequestedDateMatch = (f: any) => {
      if (!f?.dateRange) return null

      const dr = f.dateRange
      const startInput = dr.start ?? dr.from ?? dr.gte ?? dr[0]
      const endInput = dr.end ?? dr.to ?? dr.lte ?? dr[1]

      const match: any = {}
      if (startInput) {
        match.$gte = moment.tz(startInput, TZ).startOf('day').toDate()
      }
      if (endInput) {

        match.$lt = moment.tz(endInput, TZ).add(1, 'day').startOf('day').toDate()
      }

      return Object.keys(match).length ? match : null
    }

    const requestedDateMatch = buildRequestedDateMatch(filters)
    const baseQuery: any = {}

    if (requestedDateMatch) {
      baseQuery.createdAt = requestedDateMatch
    }

    if (filters?.status) {
      baseQuery.status = filters.status
    }

    if (filters?.$or) {
      baseQuery.$or = filters.$or
    }

    const medicineRequests = await MedicineRequestsModel.find(baseQuery)
      .populate('requestedUserId', 'name email phoneNumber')
      .sort({ _id: -1 })
      .lean()

    const formattedData: MedicineRequestRow[] = medicineRequests.map((request: any) => ({
      'Request Number': request.requestNo || '',
      'Medicine Name': request.medicineName || '',
      'Requested Date': request.requestedDate
        ? moment(request.requestedDate).tz(TZ).format('DD/MM/YYYY hh:mm A')
        : '',
      'User Name': request.requestedUserId?.name || '',
      'User Email': request.requestedUserId?.email || '',
      'User Phone': request.requestedUserId?.phoneNumber || '',
      'Status': request.status ? request.status.toUpperCase() : '',
      'Notes': request.notes || ''
    }))

    console.timeEnd('Export Medicine Requests time')
    return formattedData
  } catch (error) {
    console.error('Error exporting medicine requests:', error)
    throw new Error('Failed to export medicine requests')
  }
}