// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import type { Application } from '../../declarations'
import {
  UserService,
  UserRegisterService,
  UserRequestOtpService,
  UserForgotPasswordService,
  UserResetPasswordService,
  CheckUserRegistered,
  GetUserDetailsService,
  UserAccountService,
  VerifyUserProfileToken,
  getOptions,
  ReferralService,
  UsersAdminAccessService
} from './users.class'
import {
  getUserDetailsPath,
  userPath,
  userRegisteredCheckPath,
  userRegisterPath,
  userRequestForgotPasswordPath,
  userRequestOtpPath,
  userRequestResetPasswordPath,
  userAccountPath,
  userVerifyTokenPath,
  referralPath,
  usersAdminAccessPath
} from './users.shared'

export * from './users.class'
export * from './users.schema'

import Users from './routeConfig/users'
import UserRegister from './routeConfig/userRegister'
import UserRequestOtp from './routeConfig/requestOtp'
import UserForgotPassword from './routeConfig/forgotPassword'
import UserResetPassword from './routeConfig/resetPassword'
import UserAccount from './routeConfig/userAccount'
import UserReferral from './routeConfig/referAndEarn'
import UsersAdminAccess from './routeConfig/usersAdminAccess'

// A configure function that registers the service and its hooks via `app.configure`
export const user = (app: Application) => {
  // Route: /users/register
  UserRegister(app)

  // Route: /users/request-otp
  UserRequestOtp(app)

  // Route: /users
  Users(app)
  UserForgotPassword(app)
  UserResetPassword(app)

  // Route: /users/account
  UserAccount(app)
  // Route: /users/referral
  UserReferral(app)

  // Route: /users/admin-access
  UsersAdminAccess(app)

  app.use(userRegisteredCheckPath, new CheckUserRegistered(), {
    methods: ['find'],
    events: []
  })

  app.use(getUserDetailsPath, new GetUserDetailsService(), {
    methods: ['create'],
    events: []
  })
  app.use(userVerifyTokenPath, new VerifyUserProfileToken(getOptions(app)), {
    methods: ['create'],
    events: []
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [userPath]: UserService
    [userRegisterPath]: UserRegisterService
    [userRequestOtpPath]: UserRequestOtpService
    [userRequestForgotPasswordPath]: UserForgotPasswordService
    [userRequestResetPasswordPath]: UserResetPasswordService
    [userRegisteredCheckPath]: CheckUserRegistered
    [getUserDetailsPath]: GetUserDetailsService
    [userAccountPath]: UserAccountService
    [userVerifyTokenPath]: VerifyUserProfileToken
    [referralPath]: ReferralService
    [usersAdminAccessPath]: UsersAdminAccessService
  }
}
