import { Type, getValidator, defaultAppConfiguration, StringEnum } from '@feathersjs/typebox'
import type { Static } from '@feathersjs/typebox'

import { dataValidator } from './validators'

export const configurationSchema = Type.Intersect([
  defaultAppConfiguration,
  Type.Object({
    dbName: Type.String(),
    host: Type.String(),
    port: Type.Number(),
    protocol: Type.String(),
    public: Type.String(),
    env: StringEnum(['local', 'staging', 'production']),
    aws: Type.Object({
      keyId: Type.String(),
      secretKey: Type.String()
    }),
    s3: Type.Object({
      s3BucketName: Type.String(),
      s3BucketRegion: Type.String(),
      cloudFrontUrl: Type.String()
    }),
    razorpay: Type.Object({
      id: Type.String(),
      secret: Type.String(),
      webhookSecret: Type.String()
    }),
    email: Type.Object({
      defaultSendTo: Type.String(),
      accounts: Type.Optional(
        Type.Object({
          'no-reply': Type.Object({
            host: Type.String(),
            port: Type.Number(),
            from: Type.String(),
            auth: Type.Object({
              user: Type.String(),
              password: Type.String()
            })
          })
        })
      )
    }),
    sms: Type.Object({
      smsNotify: Type.Object({
        userId: Type.String(),
        password: Type.String(),
        senderId: Type.String(),
        dltEntityId: Type.String()
      })
    }),
    deployment: Type.Object({
      ip: Type.String(),
      api_public_url: Type.String()
    }),
    web: Type.String(),
    twilio: Type.Object({
      accountSid: Type.String(),
      authToken: Type.String(),
      from: Type.String()
    }),
    clientWeb: Type.String(),
    gptAccounts: Type.Array(Type.String()),
    demoUserEmail: Type.Optional(Type.String()),
    android: Type.Object({
      minVersion: Type.String(),
      latestVersion: Type.String(),
      forceUpdate: Type.Boolean()
    }),
    ios: Type.Object({
      minVersion: Type.String(),
      latestVersion: Type.String(),
      forceUpdate: Type.Boolean()
    }),
    googleMaps: Type.Object({
      apiKey: Type.String()
    })
  })
])

export type ApplicationConfiguration = Static<typeof configurationSchema>

export const configurationValidator = getValidator(configurationSchema, dataValidator)
