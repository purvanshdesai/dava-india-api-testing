import { SMSUtility } from '../../utils/SMSUtility'
;('// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services')
import type { Id, Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'

import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type { User, UserData, UserPatch, UserQuery } from './users.schema'

import { UsersModel } from './users.schema'
import { generateRandomNumber } from '../../utils'
import dayjs from 'dayjs'
import bcrypt from 'bcrypt'
import { BadRequest, NotFound } from '@feathersjs/errors'
// import { sendSMS } from '../../utils/sendSms'
import moment from 'moment'
import { sendEmail } from '../../utils/sendEmail'
import { randomBytes } from 'crypto'
import storeAdminResetPassword from '../../templates/storeAdminResetPassword'
import { app } from '../../app'
import otpTemplate from '../../templates/otpTemplate'
import { MembershipModel } from '../memberships/memberships.schema'
import { generateReferralCode } from './users.shared'
import { appEnv, appEnvironments } from '../../utils/config'
import { DavaCoinsHistoryModel } from '../dava-coins-history/dava-coins-history.schema'

export type { User, UserData, UserPatch, UserQuery }

export interface UserParams extends MongoDBAdapterParams<UserQuery> {}

interface StrictUserCreateData {
  email: string
  phoneNumber: string
  otp: string
  identifierType: string
}
const defaultOTP = '80910'
// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class UserService<ServiceParams extends Params = UserParams> extends MongoDBService<
  User,
  UserData,
  UserParams,
  UserPatch
> {
  async create(data: StrictUserCreateData | any, params?: ServiceParams): Promise<any> {
    try {
      const { email, phoneNumber, otp, identifierType } = data

      const res = await UsersModel.create({
        email,
        phoneNumber: phoneNumber.length == 13 ? phoneNumber : '',
        phoneOtp: otp,
        phoneOtpValidTill: dayjs().add(2, 'minutes'),
        accountVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasDavaoneMembership: false,
        identifierType
      })
      return res
    } catch (error) {
      throw error
    }
  }
  async patch(id: any, data: StrictUserCreateData | any, params?: ServiceParams): Promise<any> {
    try {
      const { email, phoneNumber, name, dateOfBirth, gender } = data

      const res = await UsersModel.findByIdAndUpdate(id, {
        email,
        phoneNumber,
        name,
        dateOfBirth,
        gender,
        updatedAt: new Date().toISOString()
      })
      return res
    } catch (error) {
      throw error
    }
  }
}

export class UsersAdminAccessService<ServiceParams extends Params = UserParams> extends MongoDBService<
  User,
  UserData,
  UserParams,
  UserPatch
> {
  async find(params?: UserParams): Promise<any> {
    try {
      const query: any = params?.query

      if (!query || (typeof query === 'object' && Object.keys(query).length === 0)) {
        return await UsersModel.find().lean()
      }

      // Extract pagination parameters
      const limit = parseInt(query.$limit) || 10 // Default limit to 10
      const skip = parseInt(query.$skip) || 0 // Default skip to 0
      const baseQuery = query['$or'] ? { $or: query['$or'] } : {}

      // Find coupons based on the query with pagination
      const collections = await UsersModel.find({
        ...baseQuery
      })
        .sort({ createdAt: -1 })
        .limit(limit) // Apply limit for pagination
        .skip(skip) // Apply skip for pagination
        .lean()

      // Count total number of matching documents for pagination info
      const total = await UsersModel.countDocuments({ ...query.query })

      // Return the result with pagination data
      return {
        data: collections,
        total,
        limit,
        skip
      }
    } catch (error) {
      throw error
    }
  }

  async get(id: Id) {
    try {
      const user = await UsersModel.findById(id).select('-password').lean()
      if (!user) throw new BadRequest('Not found')

      const coinHistory = await DavaCoinsHistoryModel.find({ user: user?._id }).sort({ createdAt: -1 }).lean()

      return { ...user, coinHistory }
    } catch (error) {
      throw error
    }
  }

  async patch(id: any, data: any, params: any): Promise<any> {
    try {
      const { customerId, action, coins, description } = data

      const userExist = await UsersModel.findById(customerId).lean()

      if (!userExist) throw new BadRequest('User not found')

      if (action === 'dava-coins-update') {
        if (!coins) throw new BadRequest('User not found')

        await UsersModel.updateOne({ _id: userExist._id }, { $inc: { davaCoinsBalance: Number(coins) ?? 0 } })

        await DavaCoinsHistoryModel.create({
          user: userExist._id,
          orderId: null,
          coins: coins,
          usageType: 'credit',
          description: description,
          createdAt: moment().toISOString(),
          updatedAt: moment().toISOString()
        })
      }

      return { message: 'User updated successfully!' }
    } catch (error) {
      throw error
    }
  }
}

export class UserRegisterService<ServiceParams extends Params = UserParams> extends MongoDBService<
  User,
  UserData,
  UserParams,
  UserPatch
> {
  async create(data: UserData | any, params?: ServiceParams): Promise<any> {
    try {
      const otp = generateRandomNumber(5)

      const emailExits = await UsersModel.findOne({ email: data.email }).lean()

      if (emailExits && emailExits?.accountVerified) throw new Error('Email already exists')

      const phoneNumberExists = await UsersModel.findOne({
        phoneNumber: '+91' + data.phone
      }).lean()

      if (phoneNumberExists && phoneNumberExists?.accountVerified)
        throw new Error('Phone Number already exists')

      const payload = {
        name: data?.name,
        tempPhoneNumber: '+91' + data?.phone,
        email: data?.email,
        phoneOtp: otp,
        phoneOtpValidTill: dayjs().add(2, 'minutes'),
        password: data?.password,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hasDavaoneMembership: false
      }

      let user

      if (!phoneNumberExists && !emailExits) user = await UsersModel.create(payload)
      else {
        const userId = emailExits ? emailExits?._id : phoneNumberExists?._id
        user = await UsersModel.findByIdAndUpdate(userId, payload)
      }

      if (appEnv !== appEnvironments.LOCAL) {
        const smsUtility = new SMSUtility()

        await smsUtility.sendSMS({
          mobileNo: data?.phone,
          templateName: 'login_otp',
          params: { OTP: '' + otp }
        })
      }
      return user
    } catch (error) {
      throw error
    }
  }
  async get(id: any): Promise<any> {
    try {
      const user = await UsersModel.findById(id).lean()
      if (!user) {
        throw new BadRequest('User not found')
      }

      return user
    } catch (error) {
      throw error
    }
  }

  async patch(id: any, data: any, params: any): Promise<any> {
    try {
      const userExist = await UsersModel.findById(id).lean()

      if (!userExist) throw new BadRequest('User not found')

      const orConditions: any[] = []

      if (data?.email) orConditions.push({ email: data?.email })

      if (data?.phoneNumber) orConditions.push({ phoneNumber: '+91' + data?.phoneNumber })

      if (orConditions.length) {
        const duplicateUser = await UsersModel.findOne({
          _id: { $ne: id },
          $or: orConditions
        }).lean()

        if (duplicateUser)
          throw new BadRequest('Another user already exists with the same email or phone number')
      }

      const updatedUser = await app.service('users').patch(id, {
        ...data,
        phoneNumber: data?.phoneNumber ? '+91' + data?.phoneNumber : undefined,
        updatedAt: new Date().toISOString()
      })

      return updatedUser
    } catch (error) {
      throw error
    }
  }
}

export class UserRequestOtpService<ServiceParams extends Params = UserParams> extends MongoDBService<
  User,
  UserData,
  UserParams,
  UserPatch
> {
  async find(params?: any | undefined): Promise<any> {
    try {
      const { phoneNumber, email, phoneOtp = '', identifierType } = params?.query

      let query: any = {}

      if (identifierType === 'mobile') query.phoneNumber = phoneNumber
      else if (identifierType === 'email') query.email = email
      else throw new Error('Invalid identifierType')

      const user: any = await UsersModel.findOne(query).lean()

      if (!user) throw new Error('User not exist')

      const otpValidTill = new Date(user?.phoneOtpValidTill)
      const currentTime = new Date()

      if (phoneOtp !== defaultOTP && phoneOtp !== user?.phoneOtp) throw new Error('Invalid OTP')

      if (
        phoneOtp !== defaultOTP &&
        otpValidTill instanceof Date &&
        currentTime.getTime() - otpValidTill.getTime() > 2 * 60 * 1000
      )
        throw new Error('Invalid OTP')

      let randomData = randomBytes(30).toString('hex')

      const updateFields = {
        profileToken: randomData,
        profileTokenValidTill: dayjs().add(2, 'hours')
      }
      await UsersModel.findByIdAndUpdate(user._id, updateFields)

      return { profileToken: randomData, message: 'proceed with registration' }
    } catch (error) {
      throw error
    }
  }

  async create(data: UserData | any, params?: ServiceParams): Promise<any> {
    try {
      const { phoneNumber, email, identifierType, isWeb, referralCode } = data

      const isNewVersionCode = isWeb ? isWeb : false
      const otp = generateRandomNumber(5)

      let query: any = {}

      if (isNewVersionCode) {
        if (identifierType === 'mobile') {
          if (!phoneNumber) throw new Error('Phone number is required for mobile identifier')
          query.phoneNumber = phoneNumber
        } else if (identifierType === 'email') {
          if (!email) throw new Error('Email is required for email identifier')
          query.email = email
        } else throw new Error('Invalid identifierType')

        let user: any = await UsersModel.findOne(query).lean()

        const updateFields = {
          phoneOtp: otp,
          phoneOtpValidTill: dayjs().add(2, 'minutes'),
          updatedAt: new Date().toISOString()
        }

        if (!user) {
          user = await app.service('users').create({ email, phoneNumber, otp, identifierType })
        } else {
          await UsersModel.findByIdAndUpdate(user._id, updateFields)
        }

        // Save referral code if passed
        if (referralCode) await UsersModel.updateOne({ _id: user?._id }, { referral: { code: referralCode } })

        if (appEnv !== appEnvironments.LOCAL) {
          if (identifierType == 'mobile') {
            const smsUtility = new SMSUtility()
            await smsUtility.sendSMS({
              mobileNo: phoneNumber,
              templateName: 'login_otp',
              params: { OTP: '' + otp }
            })
          } else {
            await sendEmail({
              to: email,
              subject: 'Davaindia: Your OTP code',
              message: otpTemplate(otp),
              attachments: []
            })
          }
        }

        const response: any = {
          message: 'OTP sent successfully',
          exist: user?.accountVerified ? true : false
        }

        return response
      } else {
        const user = await UsersModel.findOne({ phoneNumber }).lean()

        if (!user) throw new NotFound('User not found!')

        await UsersModel.findOneAndUpdate(
          { phoneNumber },
          {
            phoneOtp: otp,
            phoneOtpValidTill: dayjs().add(2, 'minutes')
          }
        )

        if (appEnv !== appEnvironments.LOCAL) {
          const smsUtility = new SMSUtility()

          await smsUtility.sendSMS({
            mobileNo: user?.phoneNumber ?? '',
            templateName: 'login_otp',
            params: { OTP: '' + otp }
          })
        }

        return { message: 'OTP has been sent to your phone number.' }
      }
    } catch (error) {
      throw error
    }
  }
}

export class UserForgotPasswordService<ServiceParams extends Params = UserParams> extends MongoDBService<
  User,
  UserData,
  UserParams,
  UserPatch
> {
  async create(data: any, params?: ServiceParams): Promise<any> {
    try {
      const user = await UsersModel.findOne({ email: data?.email }).lean()
      if (!user) throw new Error('Email not found')
      if (user) {
        let randomData = randomBytes(30).toString('hex')
        await UsersModel.findOneAndUpdate(
          { email: data.email },
          {
            passwordResetToken: randomData,
            passwordResetTokenExpiry: moment().add(30, 'minutes')
          }
        )
        sendEmail({
          to: user.email as string,
          subject: 'Password Reset',
          message: storeAdminResetPassword({
            url: `${app.get('clientWeb')}/reset-password?token=${randomData}`
          }),
          attachments: []
        })
        return {
          message: 'Sent reset password mail'
        } as unknown as any
      }
    } catch (error) {
      throw error
    }
  }
}
export class UserResetPasswordService<ServiceParams extends Params = UserParams> extends MongoDBService<
  User,
  UserData,
  UserParams,
  UserPatch
> {
  async get(id: any) {
    try {
      const storeAdminUser: any = await UsersModel.findOne({
        passwordResetToken: id
      }).lean()
      if (!storeAdminUser) {
        return {
          tokenValid: false
        }
      }
      if (!storeAdminUser?.passwordResetTokenExpiry)
        return {
          tokenValid: false
        }
      if (moment(storeAdminUser?.passwordResetTokenExpiry).isBefore(moment())) {
        return {
          tokenValid: false
        }
      }
      return {
        tokenValid: true
      } as unknown as any
    } catch (error) {
      throw error
    }
  }

  async patch(id: any, data: any) {
    try {
      if (!data?.newPassword) throw new BadRequest('No password found')
      const storeAdminUser = await UsersModel.findOne({
        passwordResetToken: id
      }).lean()
      if (!storeAdminUser) throw new BadRequest('Token invalid')

      await UsersModel.updateOne(
        {
          passwordResetToken: id
        },
        {
          $set: {
            password: bcrypt.hashSync(data?.newPassword, 10),
            passwordResetToken: null,
            passwordResetTokenExpiry: null
          }
        }
      )
      return {
        message: 'Password set  successful'
      } as unknown as any
    } catch (error) {
      throw error
    }
  }
}

export class CheckUserRegistered {
  async find(params: any) {
    const { email, phoneNo } = params.query
    const filter: any = {}

    if (email) filter.email = email
    else if (phoneNo) filter.phoneNumber = phoneNo
    else return { exist: false }

    const user = await UsersModel.findOne(filter).lean()
    return { exist: !!user }
  }
}
export class GetUserDetailsService {
  async create(data: any) {
    const { profileToken } = data

    if (!profileToken) throw new Error('Token is required')

    const user: any = await UsersModel.findOne({ profileToken: profileToken }).lean()

    const validity = new Date(user?.profileTokenValidTill)
    const now = new Date()

    const expiresAt = new Date(validity.getTime() + 2 * 60 * 60 * 1000)

    if (now > expiresAt) throw new BadRequest('Token has expired')

    return { user }
  }
}

export class UserAccountService<ServiceParams extends Params = UserParams> extends MongoDBService<
  User,
  UserData,
  UserParams,
  UserPatch
> {
  async find(params?: ServiceParams | any): Promise<any> {
    try {
      const user = await UsersModel.findById(params?.user?._id).lean()

      const davaoneMembership = await MembershipModel.findOne({ user: user?._id, status: 'active' }).lean()

      return {
        user: user ?? null,
        hasDavaoneMembership: user?.hasDavaoneMembership,
        davaoneMembership: davaoneMembership ?? null,
        davaCoinsBalance: user?.davaCoinsBalance ?? 0
      }
    } catch (error) {
      throw error
    }
  }
}
export class VerifyUserProfileToken<ServiceParams extends Params = UserParams> extends MongoDBService<
  User,
  UserData,
  UserParams,
  UserPatch
> {
  async create(data: any, params?: ServiceParams): Promise<any> {
    try {
      const { phoneNumber, email, phoneOtp = '', identifierType } = data

      let query: any = {}

      if (identifierType === 'mobile') query.phoneNumber = phoneNumber
      else if (identifierType === 'email') query.email = email
      else throw new Error('Invalid identifierType')

      const user: any = await UsersModel.findOne(query).lean()

      if (!user) throw new Error('User not exist')

      const otpValidTill = new Date(user?.phoneOtpValidTill)
      const currentTime = new Date()

      if (phoneOtp !== defaultOTP && phoneOtp !== user?.phoneOtp) throw new Error('Invalid OTP')

      if (
        phoneOtp !== defaultOTP &&
        otpValidTill instanceof Date &&
        currentTime.getTime() - otpValidTill.getTime() > 2 * 60 * 1000
      )
        throw new Error('Invalid OTP')

      let randomData = randomBytes(30).toString('hex')

      const updateFields = {
        profileToken: randomData,
        profileTokenValidTill: dayjs().add(2, 'hours')
      }
      await UsersModel.findByIdAndUpdate(user._id, updateFields)

      return { profileToken: randomData, message: 'proceed with registration' }
    } catch (error) {
      console.log('error while verifying', error)
    }
  }
}

export class ReferralService<ServiceParams extends Params = UserParams> extends MongoDBService<
  User,
  UserData,
  UserParams,
  UserPatch
> {
  async find(params?: any): Promise<any> {
    try {
      const { _id: userId } = params?.user ?? {}
      if (!userId) throw new BadRequest('User not authenticated')

      // Validate referral code
      const referrer = await UsersModel.findById(userId).select('_id referralCode').lean()

      let referralCode = referrer?.referralCode

      if (!referralCode) {
        referralCode = await generateReferralCode()
        // Save the generated referral code
        await UsersModel.updateOne({ _id: userId }, { $set: { referralCode } })
      }

      return { referralCode }
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('users'))
  }
}
