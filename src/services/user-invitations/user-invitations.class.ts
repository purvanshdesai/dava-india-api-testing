// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'
import type { Application } from '../../declarations'
import type {
  UserInvitations,
  UserInvitationsData,
  UserInvitationsPatch,
  UserInvitationsQuery
} from './user-invitations.schema'
import { UserInvitationModel } from './user-invitations.schema'
import { Paginated } from '@feathersjs/feathers'
import { BadRequest } from '@feathersjs/errors'
import { SuperAdminUsersModel } from '../super-admin-users/super-admin-users.schema'
import { sendEmail } from '../../utils/sendEmail'
import superAdminInvitationTemplate from '../../templates/superAdminInvitationTemplate'
import { app } from '../../app'
import { manageTicketPermissionsFromRole, manageUserFullAccess } from '../../cache/redis/permissions'
import { RolesModel } from '../roles/roles.schema'

export type { UserInvitations, UserInvitationsData, UserInvitationsPatch, UserInvitationsQuery }

export interface UserInvitationsParams extends MongoDBAdapterParams<UserInvitationsQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class UserInvitationsService<
  ServiceParams extends Params = UserInvitationsParams
> extends MongoDBService<UserInvitations, UserInvitationsData, UserInvitationsParams, UserInvitationsPatch> {
  async create(data: UserInvitationsData | any, params?: ServiceParams): Promise<any> {
    try {
      const payload = {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const userExist = await SuperAdminUsersModel.findOne({ email: data?.email, archive: true }).lean()
      if (userExist) {
        await SuperAdminUsersModel.findByIdAndDelete(userExist._id)
      }

      const user: any = await UserInvitationModel.findOne({ email: data?.email })

      if (!userExist && user && user?.status == 'accepted') throw new Error('User already accepted.')

      if (user && user?.status == 'invited') throw new Error('User already invited.')

      const config = app.get('web')
      const invitation = await UserInvitationModel.create(payload)

      const URL = `${config}/invitation?invitationToken=${invitation.token}`

      sendEmail({
        to: data.email,
        subject: 'Invitation to Dava India Admin',
        message: superAdminInvitationTemplate({ name: data.name, url: URL }),
        attachments: []
      })

      return invitation
    } catch (error) {
      throw error
    }
  }

  async remove(id: any): Promise<any> {
    try {
      const invitation = await UserInvitationModel.findById(id).lean()

      if (!invitation) throw new BadRequest('Invitation not found')

      await UserInvitationModel.findByIdAndDelete(id)

      return invitation
    } catch (error) {
      throw error
    }
  }
  generateToken() {
    return require('crypto').randomBytes(32).toString('hex').substring(0, 10)
  }
}

export class StoreAdminService<ServiceParams extends Params = UserInvitationsParams> extends MongoDBService<
  UserInvitations,
  UserInvitationsData,
  UserInvitationsParams,
  UserInvitationsPatch
> {
  async find(params: any): Promise<any | Paginated<any>> {
    try {
      const { invitationToken } = params?.query

      const invitation: any = await UserInvitationModel.findOne({
        token: invitationToken
      })

      if (invitation) {
        if (new Date() < invitation.expiryAt) {
          return {
            status: true,
            invitation,
            code: 200
          }
        } else throw new BadRequest('Invitation token expired')
      } else throw new BadRequest('Invalid Invitation token')
    } catch (e) {
      throw e
    }
  }

  async patch(id: any, data: any) {
    const { action, userEmail, userName, role, extraAttr } = data

    if (action === 'accept') {
      const invitation: any = await UserInvitationModel.findByIdAndUpdate(
        id,
        { status: 'accepted' },
        { returnDocument: 'after' }
      )
      const existingAdminUser = await SuperAdminUsersModel.findOne({
        email: userEmail
      }).lean()

      if (!existingAdminUser) {
        const res = await app.service('super-admin-users').create({
          email: userEmail,
          name: userName,
          password: 'da@admin',
          role: role,
          isActive: true,
          createdAt: new Date().toISOString(),
          extraAttr: extraAttr
        })

        const roleDoc = await RolesModel.findById(res.role).lean()
        if (!roleDoc) throw new BadRequest('Role not found')

        // TODO add user to permission cache
        if (roleDoc.fullAccess) await manageUserFullAccess(res._id.toString(), 'add')
        else
          await manageTicketPermissionsFromRole({
            userIds: [res._id as string],
            roleId: role,
            operation: 'add'
          })

        await UserInvitationModel.findByIdAndDelete(id)
      }
      return invitation
    }

    const invitation: any = await UserInvitationModel.findByIdAndUpdate(id, {
      status: 'rejected'
    })

    return invitation
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('user-invitations'))
  }
}
