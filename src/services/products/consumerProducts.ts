// For more information about this file see https://dove.feathersjs.com/guides/cli/service.html

import { hooks as schemaHooks } from '@feathersjs/schema'

import {
  productsQueryValidator,
  productsResolver,
  productsExternalResolver,
  productsQueryResolver,
  productsSchema,
  productsQueryProperties,
  productsQueryProperties1
} from './products.schema'

import type { Application } from '../../declarations'
import { ProductsService, ProductSeoService, ProductService, getOptions } from './products.class'
import { productsPath, productsSeoPath, productPath } from './products.shared'
import { createSwaggerServiceOptions } from 'feathers-swagger'
import { Type } from '@feathersjs/typebox'
import { ProductSchemaSwagger } from './SwaggerHelpers/SwaggerResponse'
import { FilterSchema } from './SwaggerHelpers/FilterSchema'
import { conditionalAuthentication } from '../../utils'

export * from './products.class'
export * from './products.schema'

// A configure function that registers the service and its hooks via `app.configure`
export const consumerProducts = (app: Application) => {
  // Register our service on the Feathers application
  app.use(productsPath, new ProductsService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['find', 'get'],
    // You can add additional custom events to be sent to clients here
    events: [],
    docs: createSwaggerServiceOptions({
      schemas: {
        queryParameters: productsQueryProperties1
      },
      docs: {
        operations: {
          find: {
            summary: 'Get All Products',
            description: 'This endpoint retrieves all products',
            responses: {
              200: {
                description: 'Get All products successfully',
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
                          items: ProductSchemaSwagger
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
            summary: 'Get particular Product',
            description: 'This endpoint retrieves particular Product',
            responses: {
              200: {
                description: 'Get Single Entity of product successfully',
                content: {
                  'application/json': {
                    schema: ProductSchemaSwagger
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

  app.use(productsSeoPath, new ProductSeoService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['get'],
    // You can add additional custom events to be sent to clients here
    events: []
  })

  app.use(productPath, new ProductService(getOptions(app)), {
    // A list of all methods this service exposes externally
    methods: ['find'],
    // You can add additional custom events to be sent to clients here
    events: []
  })

  // Initialize hooks
  app.service(productsPath).hooks({
    around: {
      all: [
        schemaHooks.resolveExternal(productsExternalResolver),
        schemaHooks.resolveResult(productsResolver)
      ]
    },
    before: {
      all: [
        schemaHooks.validateQuery(productsQueryValidator),
        schemaHooks.resolveQuery(productsQueryResolver)
      ],
      find: [],
      get: []
    },
    after: {
      all: []
    },
    error: {
      all: []
    }
  })

  app.service(productsSeoPath).hooks({})
  app.service(productPath).hooks({})
}

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    [productsPath]: ProductsService
    [productsSeoPath]: ProductSeoService
    [productPath]: ProductService
  }
}
