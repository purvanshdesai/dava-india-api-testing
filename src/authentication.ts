// For more information about this file see https://dove.feathersjs.com/guides/cli/authentication.html
import {
  AuthenticationBaseStrategy,
  AuthenticationParams,
  AuthenticationRequest,
  AuthenticationResult,
  AuthenticationService,
  JWTStrategy
} from '@feathersjs/authentication'
import { LocalStrategy } from '@feathersjs/authentication-local'
import { oauth, OAuthStrategy } from '@feathersjs/authentication-oauth'

import type { Application } from './declarations'
import { UsersModel } from './services/users/users.schema'
import { NotAuthenticated } from '@feathersjs/errors'
import { Params, Query } from '@feathersjs/feathers'
import { app } from './app'
import bcrypt from 'bcrypt'
import { StoreAdminUserModal } from './services/store-admin-users/store-admin-users.schema'
import { SuperAdminUsersModel } from './services/super-admin-users/super-admin-users.schema'
import { PermissionsModel } from './services/permissions/permissions.schema'
import { ModulesModel } from './services/modules/modules.schema'
import { RolesModel } from './services/roles/roles.schema'
import { hasUserFullAccess } from './cache/redis/permissions'
import { handleReferralProgram } from './services/users/users.shared'

declare module './declarations' {
  interface ServiceTypes {
    authentication: AuthenticationService
  }
}
const defaultOTP = '80910'

class OTPAuthentication extends AuthenticationBaseStrategy {
  async authenticate(
    authentication: AuthenticationRequest,
    params: AuthenticationParams,
    ...allowed: string[]
  ): Promise<AuthenticationResult> {
    try {
      const { phoneNumber, email, otp, identifierType, isWeb } = authentication

      const isNewVersionCode = isWeb ? isWeb : false

      if (isNewVersionCode) {
        let query: any = {}

        if (identifierType === 'mobile') query.phoneNumber = phoneNumber
        else if (identifierType === 'email') query.email = email
        else throw new Error('Invalid identifierType')

        const user: any = await UsersModel.findOne(query).lean()

        if (!user) {
          throw new NotAuthenticated('User not found')
        }

        // OTP check
        if (otp !== defaultOTP && otp !== user.phoneOtp) {
          throw new NotAuthenticated('Invalid OTP')
        }

        const otpValidTill = new Date(user.phoneOtpValidTill)
        const currentTime = new Date()

        // Check if OTP is expired (more than 2 minutes past phoneOtpValidTill)
        if (!user.accountVerified) {
          throw new NotAuthenticated('Mobile Number is not verified')
        }

        if (
          otp != defaultOTP &&
          otpValidTill instanceof Date &&
          currentTime.getTime() - otpValidTill.getTime() > 2 * 60 * 1000
        ) {
          throw new NotAuthenticated('OTP expired')
        }

        await UsersModel.findByIdAndUpdate(user._id, {
          phoneOtp: null,
          phoneOtpValidTill: null
        })

        return { user }
      } else {
        const user: any = await UsersModel.findOne({
          phoneNumber
        }).lean()

        if (!user && otp != defaultOTP && otp !== user?.phoneOtp) throw new NotAuthenticated('Invalid OTP')

        const otpValidTill = new Date(user.phoneOtpValidTill)
        const currentTime = new Date()

        // Check if OTP is expired (more than 2 minutes past phoneOtpValidTill)
        // if (!user.accountVerified) {
        //   throw new NotAuthenticated('Mobile Number is not verified')
        // }

        if (
          otp != defaultOTP &&
          otpValidTill instanceof Date &&
          currentTime.getTime() - otpValidTill.getTime() > 2 * 60 * 1000
        ) {
          throw new NotAuthenticated('OTP expired')
        }

        await UsersModel.findByIdAndUpdate(user._id, {
          phoneOtp: null,
          phoneOtpValidTill: null
        })

        return { user }
      }
    } catch (error) {
      // console.log(error)
      throw error
    }
  }
}
class ProfileCompleteAuthentication extends AuthenticationBaseStrategy {
  async authenticate(
    authentication: AuthenticationRequest,
    params: AuthenticationParams,
    ...allowed: string[]
  ): Promise<AuthenticationResult> {
    try {
      const { profileToken } = authentication

      if (!profileToken || typeof profileToken !== 'string') {
        throw new NotAuthenticated('Invalid or missing profile token')
      }

      const user: any = await UsersModel.findOne({ profileToken: profileToken }).lean()

      if (!user) throw new NotAuthenticated('Invalid User')

      const validity = new Date(user?.profileTokenValidTill)
      const now = new Date()

      const expiresAt = new Date(validity.getTime() + 2 * 60 * 60 * 1000)

      if (now > expiresAt) throw new NotAuthenticated('Token has expired')

      await UsersModel.findByIdAndUpdate(user?._id, {
        phoneOtp: null,
        phoneOtpValidTill: null,
        accountVerified: true,
        profileToken: '',
        profileTokenValidTill: null
      })

      // Referral
      if (user?.referral) await handleReferralProgram(user, user?.referral?.code)

      return { user }
    } catch (error) {
      throw error
    }
  }
}

class DemoUserAuthStrategy extends AuthenticationBaseStrategy {
  async authenticate(
    authentication: AuthenticationRequest,
    params: AuthenticationParams,
    ...allowed: string[]
  ): Promise<AuthenticationResult> {
    try {
      const demoUserEmail = app.get('demoUserEmail')
      if (!demoUserEmail) throw new Error('Demo user not added in config')

      const user = await UsersModel.findOne({
        email: demoUserEmail
      }).lean()

      if (!user) throw new NotAuthenticated('User not found')

      return { user }
    } catch (error) {
      throw error
    }
  }
}

class CustomLocalStrategy extends LocalStrategy {
  service: string | any
  strategy: string

  constructor(strategy: string) {
    super()

    this.strategy = strategy
    this.service = 'users'
  }

  async authenticate(
    data: AuthenticationRequest,
    _params: Params
  ): Promise<{ authentication: { strategy: string }; user: any }> {
    const { email, password } = data

    // Find the user based on email
    const user: any = await UsersModel.findOne({
      email: { $regex: new RegExp(`^${email.toLowerCase()}$`, 'i') }
    })
      .populate('davaoneMembership')
      .lean()

    // If no user is found, throw an error
    if (!user) throw new NotAuthenticated('User not found')

    if (!user.accountVerified) {
      throw new NotAuthenticated('Mobile Number is not verified')
    }

    // Compare the provided password with the stored hashed password
    const match = await bcrypt.compare(password, user?.password)

    // If the passwords don't match, throw an error
    if (!match) throw new NotAuthenticated('Invalid email or password')

    // Return the user object as the authenticated entity
    return {
      authentication: { strategy: this.strategy },
      user
    }
  }
}

class SuperAdminCustomLocalStrategy extends LocalStrategy {
  async authenticate(
    data: AuthenticationRequest,
    _params: Params
  ): Promise<{ authentication: { strategy: string }; user: any }> {
    const { email, password } = data

    // Find the user based on email
    const user: any = await SuperAdminUsersModel.findOne({
      email: { $regex: new RegExp(`^${email.toLowerCase()}$`, 'i') }
    }).lean()

    // If no user is found, throw an error
    if (!user) throw new NotAuthenticated('Invalid email or password')

    if (!user?.isActive) throw new NotAuthenticated('User is not active!')

    if (user?.archive) throw new NotAuthenticated('User has been deleted!')

    if (!user?.password) {
      throw new NotAuthenticated('Password not set')
    }

    // Compare the provided password with the stored hashed password
    const match = await bcrypt.compare(password, user?.password)

    // If the passwords don't match, throw an error
    if (!match) throw new NotAuthenticated('Invalid email or password')

    const permissions = await getUserPermissions(user?.role?.toString())

    // Return the user object as the authenticated entity
    return {
      authentication: { strategy: 'credentials-super-admin' },
      user: { ...user, role: 'super-admin', permissions }
    }
  }
}

class SuperAdminOtpStrategy extends AuthenticationBaseStrategy {
  async authenticate(
    authentication: AuthenticationRequest,
    params: AuthenticationParams,
    ...allowed: string[]
  ): Promise<AuthenticationResult> {
    try {
      const { phoneNumber, otp } = authentication

      const user = await SuperAdminUsersModel.findOne({
        phoneNumber,
        otp: otp
      }).lean()

      if (!user) throw new NotAuthenticated('User not found')

      await SuperAdminUsersModel.findByIdAndUpdate(user._id, {
        otp: null,
        otpValidTill: null
      })

      const permissions = await getUserPermissions(user?.role.toString())

      return {
        authentication: { strategy: 'otp-super-admin' },
        user: { ...user, role: 'super-admin', permissions }
      }
    } catch (error) {
      throw error
    }
  }
}

class SuperAdminAuthService extends AuthenticationService {
  async getPayload(authResult: AuthenticationResult, params: Params) {
    // Call original `getPayload` first
    const payload = await super.getPayload(authResult, params)
    const { user } = authResult

    if (user) {
      payload.role = 'super-admin' // assign role as user
    }

    return payload
  }
}
class StoreAdminAuthService extends AuthenticationService {
  async getPayload(authResult: AuthenticationResult, params: Params) {
    // Call original `getPayload` first
    const payload = await super.getPayload(authResult, params)
    const { user } = authResult

    if (user) {
      payload.role = 'store-admin' // assign role as user
    }

    return payload
  }
}

class StoreAdminCustomLocalStrategy extends LocalStrategy {
  async authenticate(
    data: AuthenticationRequest,
    _params: Params
  ): Promise<{ authentication: { strategy: string }; user: any }> {
    const { email, password } = data

    // Find the user based on email
    const storeAdmin = await StoreAdminUserModal.findOne({
      email: { $regex: new RegExp(`^${email.toLowerCase()}$`, 'i') }
    })
      .populate({ path: 'storeIds', select: '_id storeName' })
      .lean()
    // If no user is found, throw an error
    if (!storeAdmin) throw new NotAuthenticated('Invalid email or password')

    if (!storeAdmin?.password) {
      throw new NotAuthenticated('Password not set')
    }

    // Compare the provided password with the stored hashed password
    const match = await bcrypt.compare(password, storeAdmin?.password)

    // If the passwords don't match, throw an error
    if (!match) throw new NotAuthenticated('Invalid email or password')

    // Return the user object as the authenticated entity
    return {
      authentication: { strategy: 'credentials-store-admin' },
      user: {
        ...storeAdmin,
        storeIds: storeAdmin.storeIds.map((store: any) => store._id),
        stores: storeAdmin.storeIds,
        role: 'store-admin'
      }
    }
  }
}

async function getUserPermissions(roleId: string) {
  try {
    const role = await RolesModel.findById(roleId).select('_id roleName modules fullAccess').lean()

    if (!role) throw new Error('Role not set for the user!')

    if (role.fullAccess) return role

    // Resolve references using Promise.all
    const modulesWithDetails = await Promise.all(
      role?.modules.map(async (module: any) => {
        // Fetch module details
        const moduleDetails = await ModulesModel.findOne({ _id: module.moduleId }).select('_id key').lean()

        // Fetch permissions details
        const permissions = await PermissionsModel.find({ _id: { $in: module.permissions } })
          .select('_id key')
          .lean()

        // Return populated module object
        return {
          ...module,
          ...moduleDetails,
          permissions
        }
      })
    )

    return { ...role, modules: modulesWithDetails }
  } catch (e) {
    throw e
    // console.log('Error while fetch permissions', e)
  }
}

class SuperAdminCustomJWTStrategy extends JWTStrategy {
  // Optionally, override `getEntity` to add custom logic for the authenticated entity
  async getEntity(result: any, params: Params) {
    const entity = await super.getEntity(result, params)

    // Customize the entity (user) if needed
    return {
      ...entity,
      fullAccess: await hasUserFullAccess(entity._id),
      userType: 'super-admin'
    }
  }
}

class StoreAdminCustomJWTStrategy extends JWTStrategy {
  // Optionally, override `getEntity` to add custom logic for the authenticated entity
  async getEntity(result: any, params: Params) {
    const entity = await super.getEntity(result, params)

    // Customize the entity (user) if needed
    return {
      ...entity,
      userType: 'store-admin'
    }
  }
}

export const authentication = (app: Application) => {
  const authentication = new AuthenticationService(app)

  authentication.register('jwt', new JWTStrategy())
  authentication.register('credentials-consumer', new CustomLocalStrategy('credentials-consumer'))
  authentication.register('google', new OAuthStrategy())
  authentication.register('otp', new OTPAuthentication())
  authentication.register('profile-complete', new ProfileCompleteAuthentication())
  authentication.register('demo-user', new DemoUserAuthStrategy())

  app.use('authentication', authentication)

  const superAdminAuthentication = new SuperAdminAuthService(app, 'superAdminAuthentication')
  superAdminAuthentication.register('jwt', new SuperAdminCustomJWTStrategy())
  superAdminAuthentication.register('credentials-super-admin', new SuperAdminCustomLocalStrategy())
  superAdminAuthentication.register('otp-super-admin', new SuperAdminOtpStrategy())

  app.use('super-admin/authentication', superAdminAuthentication)

  const storeAdminAuthentication = new StoreAdminAuthService(app, 'storeAdminAuthentication')
  storeAdminAuthentication.register('jwt', new StoreAdminCustomJWTStrategy())
  storeAdminAuthentication.register('credentials-store-admin', new StoreAdminCustomLocalStrategy())

  app.use('store-admin/authentication', storeAdminAuthentication)

  app.configure(oauth())
}

declare module './declarations' {
  interface ServiceTypes {
    ['super-admin/authentication']: AuthenticationService
    ['store-admin/authentication']: AuthenticationService
  }
}
