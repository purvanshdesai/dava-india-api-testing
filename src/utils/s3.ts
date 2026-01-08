import * as AWS from 'aws-sdk'
import { feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'

const app = feathers().configure(configuration())

AWS.config.update({
  region: app.get('s3').s3BucketRegion,
  credentials: {
    accessKeyId: app.get('aws').keyId,
    secretAccessKey: app.get('aws').secretKey
  }
})

export const s3 = new AWS.S3()

export const aws = AWS
