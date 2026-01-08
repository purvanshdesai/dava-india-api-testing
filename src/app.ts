// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html
import { feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'
import { koa, rest, bodyParser, errorHandler, parseAuthentication, cors, serveStatic } from '@feathersjs/koa'
import socketio from '@feathersjs/socketio'

import { configurationValidator } from './configuration'
import type { Application } from './declarations'
import { logError } from './hooks/log-error'
import { mongodb } from './mongodb'
import { authentication } from './authentication'
import { services } from './services/index'
import { channels } from './channels'
import { socketCallback } from './utils/socketCallback'
import swagger from 'feathers-swagger'
import namespaceManager from './socket/namespaceManager'
// import SocketUserManager from './utils/classes/SocketUserManager'
import { socketInstance } from './socketInstance'
import { handleQR } from './utils/handleQR'
import orderTrackerManager from './socket/orderTrackerManager'

const app: Application = koa(feathers())

// Load our app configuration (see config/ folder)
app.configure(configuration(configurationValidator))

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://davaindia-admin.teampumpkin.com',
  'https://davaindia-client.teampumpkin.com',
  'https://dev-davaindia-admin.teampumpkin.com',
  'https://dev-davaindia-client.teampumpkin.com',
  'https://app.davaindia.com',
  'https://admin.davaindia.com',
  'https://www.davaindia.com',
  'https://davaindia.com'
]
// Set up Koa middleware
app.use(
  cors({
    origin: (ctx) => {
      const requestOrigin = ctx.request.header.origin as string
      if (allowedOrigins.includes(requestOrigin)) {
        return requestOrigin // Allow this origin
      }
      return '' // Disallow if not in the list
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true
  })
)
app.use(serveStatic(app.get('public')))
app.use(errorHandler())
app.use(parseAuthentication())
// Increase body parser limit to handle bulk uploads
app.use(
  bodyParser({
    jsonLimit: '10mb',
    formLimit: '10mb',
    textLimit: '10mb'
  })
)

app.use(async (ctx, next) => {
  if (ctx.method === 'HEAD') {
    if (ctx.originalUrl.startsWith('/webhooks')) {
      // Temporarily treat the request as a GET request
      ctx.method = 'GET'
      await next()
    } else {
      await next()
    }
    return ctx
  } else if (ctx.method === 'POST' && ctx.originalUrl.startsWith('/webhooks')) {
    await next() // Allow the handler to process the POST request
    ctx.status = 200 // Override the response status to 200
  } else {
    await next()
  }
})

// Configure services and transports
app.configure(rest())
app.configure(
  socketio(
    {
      cors: {
        origin: app.get('origins')
      },
      // Increase max buffer size for Socket.IO to handle bulk uploads
      maxHttpBufferSize: 10 * 1024 * 1024 // 10MB
    },
    (io) => {
      socketInstance(io)
      socketCallback(io)
      namespaceManager(io)
      orderTrackerManager(io)
    }
  )
)
app.configure(mongodb)
app.use(handleQR)
app.configure(authentication)
app.configure(channels)
app.configure(
  swagger({
    idType: 'string',
    // docsJsonPath:
    //   app.get('env') == 'local' ? '/swagger.json' : 'https://staging.teampumpkin.com/dev-uggapi/swagger.json',
    specs: {
      info: {
        title: 'Dava India api',
        version: '1.0.0'
      },
      servers: [
        {
          url: `${app.get('protocol')}://${app.get('host')}:${app.get('port')}`,
          description: 'Local server'
        }
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer'
          }
        }
      },
      security: [{ BearerAuth: [] }]
    },
    ui: swagger.swaggerUI({})
  })
)
app.configure(services)

// Register hooks that run on all service methods
app.hooks({
  around: {
    all: [logError]
  },
  before: {},
  after: {},
  error: {}
})
// Register application setup and teardown hooks here
app.hooks({
  setup: [],
  teardown: []
})

export { app }
