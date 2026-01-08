import type { Params } from '@feathersjs/feathers'
import type { ClientApplication } from '../../client'
import type { User, UserData, UserPatch, UserQuery, UserService } from './users.class'
import type { ReferralService } from './users.class'
import { UsersModel } from './users.schema'
import { validateReferral } from '../../utils/referralValidation'
import moment from 'moment'

export type { User, UserData, UserPatch, UserQuery }

export type UserClientService = Pick<UserService<Params<UserQuery>>, (typeof userMethods)[number]>
export type ReferralClientService = Pick<ReferralService<Params<UserQuery>>, (typeof referralMethods)[number]>
export const userPath = 'users'
export const usersAdminAccessPath = '/users/admin-access'
export const userRegisterPath = '/users/register'
export const userRequestOtpPath = '/users/request-otp'
export const userRequestForgotPasswordPath = '/users/forgot-password'
export const userRequestResetPasswordPath = '/users/reset-password'
export const userRegisteredCheckPath = '/users/check-registered'
export const getUserDetailsPath = '/users/get-user'
export const userAccountPath = '/users/account'
export const userVerifyTokenPath = '/users/verifyToken'
export const referralPath = '/users/referral'

export const userMethods: Array<keyof UserService> = ['find', 'get', 'create', 'patch', 'remove']
export const referralMethods: Array<keyof ReferralService> = ['find']

export const userClient = (client: ClientApplication) => {
  const connection = client.get('connection')

  client.use(userPath, connection.service(userPath), {
    methods: userMethods
  })

  client.use(referralPath, connection.service(referralPath), {
    methods: referralMethods
  })
}

// Add this service to the client service type index
declare module '../../client' {
  interface ServiceTypes {
    [userPath]: UserClientService
    [referralPath]: ReferralClientService
  }
}

export const generateReferralCode = async () => {
  // Function to generate a random 10-digit number
  const generateRandomCode = (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let out = ''
    for (let i = 0; i < length; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return out
  }

  let referralCode = generateRandomCode()

  // Optional: ensure uniqueness
  let exists = await UsersModel.findOne({ referralCode }).lean()
  while (exists) {
    referralCode = generateRandomCode()
    console.log('🚀 ~ generateReferralCode ~ referralCode:', referralCode)

    exists = await UsersModel.findOne({ referralCode }).lean()
  }

  return referralCode
}

export const handleReferralProgram = async (user: any, referralCode: string) => {
  // Validate referral
  const validation = await validateReferral({
    userId: user._id,
    referralCode
  })

  if (validation.valid) {
    await UsersModel.findByIdAndUpdate(user._id, {
      referral: {
        code: referralCode,
        referredByUserId: validation.referrerUserId,
        referredAt: new Date(),
        referralCredited: false
      }
    })

    // Reset referral code
    const referralCodeNew = await generateReferralCode()
    await UsersModel.updateOne({ _id: validation.referrerUserId }, { referralCode: referralCodeNew })

    console.log(`Referral applied from user ${validation.referrerUserId}`)
  } else {
    console.log(`Referral not applied: ${validation.reason}`)
  }
}

interface CustomerRow {
  NAME: string
  EMAIL: string
  PHONE: string
  'CREATED AT': string
  GENDER: string
  'DATE OF BIRTH': string
}

export const exportUsers = async (filters: any): Promise<any[]> => {
  const TZ = 'Asia/Kolkata'

  const buildCreatedAtMatch = (f: any) => {
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

  const createdAtMatch = buildCreatedAtMatch(filters)
  const baseQuery: any = {}

  if (createdAtMatch) baseQuery.createdAt = createdAtMatch
  if (filters?.$or) baseQuery.$or = filters.$or

  const users = await UsersModel.find(baseQuery).sort({ _id: -1 }).lean()

  const formatted: CustomerRow[] = users.map((u: any) => ({
    NAME: u?.name ?? '',
    EMAIL: u?.email ?? '',
    PHONE: u?.phoneNumber ?? '',
    'CREATED AT': u?.createdAt ? moment(u.createdAt).tz(TZ).format('DD/MM/YYYY hh:mm A') : '',
    GENDER: u?.gender ?? '',
    'DATE OF BIRTH': u?.dateOfBirth ? moment(u.dateOfBirth).tz(TZ).format('DD/MM/YYYY') : ''
  }))

  return formatted
}
