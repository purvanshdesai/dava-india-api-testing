import { Type } from '@feathersjs/typebox'
import { ObjectOptions } from '@feathersjs/typebox'

export const ModelObjectId = (options: ObjectOptions = {}) => {
  return Type.Union([Type.String({ objectid: true }), Type.Object({}, { additionalProperties: true })], {
    ...options
  })
}
