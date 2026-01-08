// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#database-services
import type { Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import type { Application } from '../../declarations'
import type { Attachments, AttachmentsData, AttachmentsPatch, AttachmentsQuery } from './attachments.schema'
import { StorageService } from '../../utils/StoreageService'
import { BadRequest } from '@feathersjs/errors'
import { app } from '../../app'
import { ObjectId } from 'mongodb'

export type { Attachments, AttachmentsData, AttachmentsPatch, AttachmentsQuery }

export interface AttachmentsParams extends MongoDBAdapterParams<AttachmentsQuery> {}

// By default calls the standard MongoDB adapter service methods but can be customized with your own functionality.
export class AttachmentsService<ServiceParams extends Params = AttachmentsParams> extends MongoDBService<
  Attachments,
  AttachmentsData,
  AttachmentsParams,
  AttachmentsPatch
> {
  async create(data: any, params?: any): Promise<any> {
    try {
      let storageType = params?.query?.storageType

      const storage = new StorageService(storageType)
      const uploads = await storage.multipleUpload(
        storage.getServiceName() === 'local' ? params?.files : data.files
      )
      return uploads
    } catch (error) {
      throw error
    }
  }

  async patch(id: any, data: any, params?: any): Promise<any> {
    try {
      const storage = new StorageService()
      if (!params?.files) {
        throw new BadRequest('Provide files')
      }
      if (!id) throw new BadRequest('Provide id of upload')
      const uploads = await storage.replaceUpload(id, params?.files)
      return uploads
    } catch (error) {
      throw error
    }
  }

  async remove(id: any, params?: any): Promise<any> {
    try {
      const { deleteUrl = '' } = params?.query
      let storageType
      if (deleteUrl) {
        const uploadDb = (await app.get('mongodbClient')).collection('attachments')
        const upload = await uploadDb.findOne({
          objectUrl: deleteUrl
        })
        if (!upload) throw new Error('Url not found')
        id = upload?._id.toString()
        storageType = upload?.storageService
      }
      const storage = new StorageService(storageType)
      await storage.removeUpload(new ObjectId(id))
      return {
        message: 'removed upload'
      }
    } catch (error) {
      throw error
    }
  }
}

export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('attachments'))
  }
}
