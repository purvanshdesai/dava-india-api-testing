// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html
import { authenticate } from '@feathersjs/authentication'

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  cartsDataValidator,
  cartsPatchValidator,
  cartsQueryValidator,
  cartsResolver,
  cartsExternalResolver,
  cartsDataResolver,
  cartsPatchResolver,
  cartsQueryResolver,
  cartsSchema
} from './carts.schema'

import type { Application } from '../../declarations'
import {
  CartsService,
  CartVerifyProductService,
  CartCheckOneDayDeliveryService,
  getOptions
} from './carts.class'
import {
  cartsPath,
  cartsProductVerificationPath,
  cartsCheckOneDayDeliveryPath,
  cartsMethods,
  setTimestamp
} from './carts.shared'
import { createSwaggerServiceOptions } from 'feathers-swagger'
import { Type } from '@feathersjs/typebox'

export * from './carts.class'
export * from './carts.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const carts = (app: Application) => {
  // Register our service on the Feathers application
  app.use(cartsPath, new CartsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: cartsMethods,
    // You can add additional custom events to be sent to clients here
    events: [],
    docs: createSwaggerServiceOptions({
      schemas: {},
      docs: {
        operations: {
          find: {
            summary: 'Get All Cart data',
            description: 'This endpoint retrieves all Cart data',
            responses: {
              200: {
                description: 'Get All Cart data successfully',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' },
                        limit: { type: 'integer' },
                        skip: { type: 'integer' },
                        data: {
                          type: 'array',
                          items: cartsSchema
                        }
                      }
                    }
                  }
                }
              },
              401: {
                description: 'Unauthorized',
                content: {
                  'application/json': {
                    schema: Type.Object({
                      name: Type.String({
                        description: 'Name of the error',
                        example: 'NotAuthenticated'
                      }),
                      message: Type.String({
                        description: 'Error message explaining the unauthorized status',
                        example: 'jwt must be provided'
                      }),
                      code: Type.Number({
                        description: 'HTTP status code',
                        example: 401
                      }),
                      className: Type.String({
                        description: 'Class name of the error',
                        example: 'not-authenticated'
                      }),
                      data: Type.Object({
                        name: Type.String({
                          description: 'Detailed name of the error',
                          example: 'JsonWebTokenError'
                        })
                      })
                    })
                  }
                }
              },
              400: {
                description: 'Bad Request',
                content: {
                  'application/json': {
                    schema: Type.Object({
                      name: Type.String({
                        description: 'Error name',
                        example: 'BadRequest'
                      }),
                      message: Type.String({
                        description: 'Error message',
                        example: 'Invalid input'
                      }),
                      code: Type.Number({
                        description: 'Error code',
                        example: 400
                      }),
                      className: Type.String({
                        description: 'Error class name',
                        example: 'bad-request'
                      }),
                      data: Type.Object({
                        details: Type.String({
                          description: 'Detailed error information',
                          example: 'The input provided does not meet the required criteria.'
                        })
                      })
                    })
                  }
                }
              }
            },
            headers: {
              'X-Auth-Token': {
                description: 'Authentication token',
                required: true,
                schema: {
                  type: 'string'
                }
              }
            }
          },
          get: {
            summary: 'Get particular Cart data',
            description: 'This endpoint retrieves particular Cart data',
            responses: {
              200: {
                description: 'Get Single Entity of Cart data successfully',
                content: {
                  'application/json': {
                    schema: cartsSchema
                  }
                }
              },
              401: {
                description: 'Unauthorized',
                content: {
                  'application/json': {
                    schema: Type.Object({
                      name: Type.String({
                        description: 'Name of the error',
                        example: 'NotAuthenticated'
                      }),
                      message: Type.String({
                        description: 'Error message explaining the unauthorized status',
                        example: 'jwt must be provided'
                      }),
                      code: Type.Number({
                        description: 'HTTP status code',
                        example: 401
                      }),
                      className: Type.String({
                        description: 'Class name of the error',
                        example: 'not-authenticated'
                      }),
                      data: Type.Object({
                        name: Type.String({
                          description: 'Detailed name of the error',
                          example: 'JsonWebTokenError'
                        })
                      })
                    })
                  }
                }
              },
              400: {
                description: 'Bad Request',
                content: {
                  'application/json': {
                    schema: Type.Object({
                      name: Type.String({
                        description: 'Error name',
                        example: 'BadRequest'
                      }),
                      message: Type.String({
                        description: 'Error message',
                        example: 'Invalid input'
                      }),
                      code: Type.Number({
                        description: 'Error code',
                        example: 400
                      }),
                      className: Type.String({
                        description: 'Error class name',
                        example: 'bad-request'
                      }),
                      data: Type.Object({
                        details: Type.String({
                          description: 'Detailed error information',
                          example: 'The input provided does not meet the required criteria.'
                        })
                      })
                    })
                  }
                }
              }
            },
            headers: {
              'X-Auth-Token': {
                description: 'Authentication token',
                required: true,
                schema: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    })
  })

  app.use(cartsProductVerificationPath, new CartVerifyProductService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['create'],
    // You can add additional custom events to be sent to clients here
    events: [],
    docs: createSwaggerServiceOptions({
      schemas: {
        createRequest: cartsSchema,
        createResponse: cartsSchema
      },
      docs: {
        operations: {}
      }
    })
  })

  app.use(cartsCheckOneDayDeliveryPath, new CartCheckOneDayDeliveryService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['create'],
    // You can add additional custom events to be sent to clients here
    events: [],
    docs: createSwaggerServiceOptions({
      schemas: {
        createRequest: cartsSchema,
        createResponse: cartsSchema
      },
      docs: {
        operations: {}
      }
    })
  })

  // Initialize hooks
  app.service(cartsPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'authentication',
          strategies: ['jwt']
        }),
        schemaHooks.resolveExternal(cartsExternalResolver),
        schemaHooks.resolveResult(cartsResolver)
      ]
    },
    before: {
      all: [schemaHooks.validateQuery(cartsQueryValidator), schemaHooks.resolveQuery(cartsQueryResolver)],
      find: [],
      get: [],
      create: [
        schemaHooks.validateData(cartsDataValidator),
        schemaHooks.resolveData(cartsDataResolver),
        setTimestamp
      ],
      patch: [
        schemaHooks.validateData(cartsPatchValidator),
        schemaHooks.resolveData(cartsPatchResolver),
        setTimestamp
      ],
      remove: []
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })

  app.service(cartsProductVerificationPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'authentication',
          strategies: ['jwt']
        })
      ]
    },
    before: {
      all: [],
      find: [],
      get: [],
      create: [],
      patch: [],
      remove: []
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })

  app.service(cartsCheckOneDayDeliveryPath).hooks({
    around: {
      all: [
        authenticate({
          service: 'authentication',
          strategies: ['jwt']
        })
      ]
    },
    before: {
      all: [],
      find: [],
      get: [],
      create: [],
      patch: [],
      remove: []
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [cartsPath]: CartsService
    [cartsProductVerificationPath]: CartVerifyProductService
    [cartsCheckOneDayDeliveryPath]: CartCheckOneDayDeliveryService
  }
}
