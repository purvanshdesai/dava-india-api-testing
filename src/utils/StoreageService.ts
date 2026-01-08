import { app } from '../app'
import { nanoid } from 'nanoid'
import path from 'path'
import fs from 'fs'
import { ObjectId } from 'mongodb'
import { File } from '@koa/multer'
import { attachmentModel } from '../services/attachments/attachments.schema'
import { s3 } from './s3'
import { S3_CONST } from '../constants/general'

export const s3DirectoryName = 'davaindia'

class LocalStorage {
  getServiceName() {
    return 'local'
  }
  async multipleUpload(files: File[]) {
    try {
      const uploadsDetails: any = []
      for (const file of files) {
        const uploadDir = path.join('public', 'attachments')
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true })
        }
        const uid = nanoid()
        const addUidFileName = `${uid}-${file.originalname}`
        const fileName = path.join(uploadDir, addUidFileName)
        fs.writeFileSync(fileName, file.buffer)
        const db = await app.get('mongodbClient')
        const save = await db.collection('attachments').insertOne({
          storageService: this.getServiceName(),
          objectDetails: {
            size: file.size,
            fileName: addUidFileName,
            originalFileName: file.originalname,
            mimeType: file.mimetype
          },
          objectUrl: `${app.get('protocol')}://${app.get('host')}:${app.get('port')}/attachments/${addUidFileName}`
        })
        const saved = await db.collection('attachments').findOne({ _id: save.insertedId })
        uploadsDetails.push(saved)
      }
      return uploadsDetails
    } catch (error) {
      throw error
    }
  }

  async removeUpload(id: ObjectId) {
    try {
      const uploadDb = (await app.get('mongodbClient')).collection('attachments')
      const upload = await uploadDb.findOne({ _id: new ObjectId(id) })

      if (!upload) throw new Error('Not found upload')
      if (upload?.storageService != this.getServiceName())
        throw new Error('Invalid storage service operation')

      const directoryName = upload?.objectUrl?.includes('attachments') ? 'attachments' : 'uploads'

      const uploadDir = path.join('public', directoryName)
      const fileName = upload?.objectDetails?.fileName
      const fileLocation = path.join(uploadDir, fileName)

      console.log('directoryName ===>', directoryName)
      console.log('fileLocation for delete ===>', fileLocation)

      fs.rm(fileLocation, () => {})

      await uploadDb.deleteOne({ _id: new ObjectId(id) })
      return true
    } catch (error) {
      throw error
    }
  }

  async replaceUpload(id: string, files: File[]) {
    try {
      if (!files?.length) throw new Error('Please upload file')
      if (files.length > 1) throw new Error('Max limit reach, only 1 file can be replaced')
      let file = files[0]
      const db = await app.get('mongodbClient')
      const upload = await db.collection('attachments').findOne({ _id: new ObjectId(id) })
      if (!upload) throw new Error('Upload not found')
      const uid = nanoid()
      const addUidFileName = `${uid}-${file.originalname}`
      const uploadDir = path.join('public', 'uploads')
      const fileName = path.join(uploadDir, addUidFileName)
      fs.writeFileSync(fileName, file.buffer)
      await db.collection('attachments').updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            storageService: this.getServiceName(),
            objectDetails: {
              size: file.size,
              fileName: addUidFileName,
              originalFileName: file.originalname,
              mimeType: file.mimetype
            },
            objectUrl: `${app.get('protocol')}://${app.get('host')}:${app.get('port')}/uploads/${addUidFileName}`
          }
        }
      )
      await db.collection('attachments').findOne({ _id: new ObjectId(id) })
      const fileNameRemove = upload?.objectDetails?.fileName
      const fileLocation = path.join(uploadDir, fileNameRemove)
      fs.rm(fileLocation, () => {})
      const updated = await db.collection('attachments').findOne({ _id: new ObjectId(id) })
      return updated
    } catch (error) {
      throw error
    }
  }

  async copyFile(fileUrl: string) {
    try {
      const uid = nanoid()
      const file = await attachmentModel.findOne({ objectUrl: fileUrl }).lean()
      if (!file) throw new Error('Invalid url')
      let copyFileName = uid + file?.objectDetails?.fileName
      const uploadDir = path.join('public', 'uploads')
      const filePath = path.join(uploadDir, file?.objectDetails?.fileName)
      const readFile = fs.readFileSync(filePath)
      const writePath = path.join(uploadDir, file?.objectDetails?.fileName)
      fs.writeFileSync(writePath, readFile)
      const copyFile = await attachmentModel.create({
        storageService: this.getServiceName(),
        objectDetails: {
          size: file?.objectDetails?.size,
          fileName: copyFileName,
          originalFileName: file?.objectDetails?.originalFileName,
          mimeType: file?.objectDetails?.mimeType
        },
        objectUrl: `${app.get('protocol')}://${app.get('host')}:${app.get('port')}/uploads/${copyFileName}`
      })
      return copyFile
    } catch (error) {
      throw error
    }
  }
}

class SS3Storage {
  getServiceName() {
    return 'S3'
  }
  async multipleUpload(files: { fileName: string; contentType: string; size: number }[]) {
    try {
      const uploadsDetails: any = []
      for (const file of files) {
        const uid = nanoid()
        const addUidFileName = `${uid}-${file.fileName}`
        const params = {
          Bucket: S3_CONST.BUCKET_NAME,
          Key: `${s3DirectoryName}/${addUidFileName}`,
          ...(process.env.NODE_ENV !== 'production' && { ACL: 'public-read' })
        }
        const preSignedUrl = await s3.getSignedUrlPromise('putObject', params)
        const db = await app.get('mongodbClient')
        const save = await db.collection('attachments').insertOne({
          storageService: this.getServiceName(),
          objectDetails: {
            size: file.size,
            fileName: addUidFileName,
            originalFileName: file.fileName,
            mimeType: file.contentType
          },
          objectUrl: `https://${S3_CONST.cloudFrontUrl}/${s3DirectoryName}/${addUidFileName}`
        })
        const saved = await db.collection('attachments').findOne({ _id: save.insertedId })
        uploadsDetails.push({
          preSignedUrl,
          ...saved
        })
      }
      return uploadsDetails
    } catch (error) {}
  }

  removeUpload(id: any) {}

  replaceUpload(id: any, file: any) {}

  copyFile(fileUrl: any) {}
}

export class StorageService {
  storage: LocalStorage | SS3Storage

  constructor(type?: 'local' | 's3') {
    const env = type || app.get('env')

    if (env == 'local') {
      this.storage = new LocalStorage()
    } else {
      this.storage = new SS3Storage()
    }
  }

  getServiceName() {
    return this.storage.getServiceName()
  }
  async multipleUpload(files: any): Promise<any> {
    try {
      return await this.storage.multipleUpload(files)
    } catch (error) {
      throw error
    }
  }

  async removeUpload(id: ObjectId) {
    try {
      return await this.storage.removeUpload(id)
    } catch (error) {
      throw error
    }
  }

  async replaceUpload(id: string, files: File[]) {
    try {
      return await this.storage.replaceUpload(id, files)
    } catch (error) {
      throw error
    }
  }
  async copyFile(fileUrl: string) {
    try {
      return this.storage.copyFile(fileUrl)
    } catch (error) {
      throw error
    }
  }
}
