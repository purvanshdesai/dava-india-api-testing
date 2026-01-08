import { authenticate } from '@feathersjs/authentication'
import { HookContext, NextFunction } from '@feathersjs/feathers'
// import { ObjectOptions, Type } from '@feathersjs/typebox'
import { app } from '../app'
import { UsersModel } from '../services/users/users.schema'
import { StoreAdminUserModal } from '../services/store-admin-users/store-admin-users.schema'
import { SuperAdminUsersModel } from '../services/super-admin-users/super-admin-users.schema'

export function generateRandomNumber(length: number): number {
  if (length <= 0) {
    throw new Error('Length must be greater than 0')
  }

  const min = Math.pow(10, length - 1)
  const max = Math.pow(10, length) - 1

  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Re-export ModelObjectId from typebox utils to maintain backward compatibility
export { ModelObjectId } from './typebox'

export const generateRandomString = (length: number) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return result
}

export const excludeFieldsInObject = (excludeList: string[], obj: any) => {
  const object: any = {}
  for (const key in obj) {
    if (!excludeList.includes(key)) {
      object[key] = obj[key]
    }
  }
  return { ...object }
}

const authSuperAdmin = authenticate({
  service: 'super-admin/authentication',
  strategies: ['jwt']
})
const authStoreAdmin = authenticate({
  service: 'store-admin/authentication',
  strategies: ['jwt']
})
const authUser = authenticate({
  service: 'authentication',
  strategies: ['jwt']
})

export const authenticateHook = async (ctx: HookContext, next: NextFunction) => {
  try {
    const token = ctx.params?.authentication?.accessToken
    if (app?.defaultAuthentication) {
      const tokenPayload = await app?.defaultAuthentication().verifyAccessToken(token)
      if (tokenPayload && tokenPayload?.role == 'super-admin') {
        return authSuperAdmin(ctx, next)
      } else if (tokenPayload && tokenPayload?.role == 'store-admin') {
        return authStoreAdmin(ctx, next)
      }
    }
    return authUser(ctx, next)
  } catch (error) {
    throw error
  }
}

export async function socketAuth(socket: any, next: (err?: Error) => void) {
  try {
    // console.log('🔌 Socket connection attempt:', {
    //   namespace: socket.nsp.name,
    //   hasToken: !!(socket?.handshake?.auth?.token || socket?.handshake?.query?.token),
    //   role: socket?.handshake?.auth?.role || 'consumer',
    //   userAgent: socket?.handshake?.headers?.['user-agent'],
    //   origin: socket?.handshake?.headers?.origin
    // })

    const roleMap: any = {
      admin: StoreAdminUserModal,
      consumer: UsersModel,
      'super-admin': SuperAdminUsersModel
    }

    // Try to get token from auth object first, then from query
    const token: any = socket?.handshake?.auth?.token || socket?.handshake?.query?.token
    const role: 'consumer' | 'admin' | 'super-admin' = socket?.handshake?.auth?.role || 'consumer'

    // console.log('🔐 Socket auth attempt:', {
    //   hasToken: !!token,
    //   role,
    //   namespace: socket.nsp.name
    // })

    if (token) {
      try {
        // Use the appropriate authentication service based on role
        let jwt: any = null
        if (role === 'super-admin' && app?.service('super-admin/authentication')) {
          jwt = await app.service('super-admin/authentication').verifyAccessToken(token)
        } else if (role === 'admin' && app?.service('store-admin/authentication')) {
          jwt = await app.service('store-admin/authentication').verifyAccessToken(token)
        } else if (app?.defaultAuthentication) {
          jwt = await app.defaultAuthentication().verifyAccessToken(token)
        }
        if (jwt && jwt.sub) {
          // console.log('✅ JWT verified successfully:', {
          //   userId: jwt.sub,
          //   role,
          //   namespace: socket.nsp.name
          // })

          const user = await roleMap[role].findById(jwt.sub).lean()
          if (user) {
            // console.log('✅ User found in database:', {
            //   userId: jwt.sub,
            //   role,
            //   namespace: socket.nsp.name,
            //   userName: user.name || user.email
            // })
            socket.handshake.query.user = user
            next()
            return
          } else {
            // console.log('❌ User data not found for ID:', jwt.sub, 'in role:', role)
            // Try other roles as fallback
            const allRoles = ['consumer', 'admin', 'super-admin']
            const otherRoles = allRoles.filter((r) => r !== role)

            for (const fallbackRole of otherRoles) {
              // Verify token with the correct authentication service for fallback role
              let fallbackJwt: any = null
              if (fallbackRole === 'super-admin' && app?.service('super-admin/authentication')) {
                fallbackJwt = await app.service('super-admin/authentication').verifyAccessToken(token)
              } else if (fallbackRole === 'admin' && app?.service('store-admin/authentication')) {
                fallbackJwt = await app.service('store-admin/authentication').verifyAccessToken(token)
              } else if (app?.defaultAuthentication) {
                fallbackJwt = await app.defaultAuthentication().verifyAccessToken(token)
              }

              if (fallbackJwt && fallbackJwt.sub === jwt.sub) {
                const fallbackUser = await roleMap[fallbackRole].findById(jwt.sub).lean()

                if (fallbackUser) {
                  // console.log('✅ User found in fallback role:', {
                  //   userId: jwt.sub,
                  //   fallbackRole,
                  //   namespace: socket.nsp.name,
                  //   userName: fallbackUser.name || fallbackUser.email
                  // })
                  socket.handshake.query.user = fallbackUser
                  next()
                  return
                }
              }
            }
          }
        }
      } catch (jwtError: any) {
        console.log('❌ JWT verification failed:', {
          error: jwtError.message,
          role,
          namespace: socket.nsp.name
        })
      }
    } else {
      console.log('❌ No token provided:', {
        namespace: socket.nsp.name
      })
    }

    // If we reach here, authentication failed
    console.log('❌ Socket authentication failed, rejecting connection:', {
      namespace: socket.nsp.name
    })
    const authError = new Error('Authentication failed - user not found or invalid token')
    next(authError)
  } catch (e: any) {
    console.log('❌ Socket authentication error:', {
      error: e.message,
      namespace: socket.nsp.name
    })
    const error = new Error('Authentication error')
    next(error)
  }
}

export const conditionalAuthentication = async (context: HookContext, next: NextFunction) => {
  const { headers } = context.params

  // Check if the `Authorization` header contains a JWT token
  const token = headers?.authorization

  if (token) {
    // If token exists, apply the authentication hook
    return authenticateHook(context, next)
  }

  // If no token is present, continue without authentication
  return context
}

export const setTimestamp = async (context: HookContext) => {
  const { data, method } = context

  if (method === 'create') {
    data.createdAt = new Date().toISOString()
  }
  data.updatedAt = new Date().toISOString()
  return context
}
