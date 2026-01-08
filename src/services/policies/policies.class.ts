import type { Id, Params } from '@feathersjs/feathers'
import { MongoDBService } from '@feathersjs/mongodb'
import type { MongoDBAdapterParams, MongoDBAdapterOptions } from '@feathersjs/mongodb'

import fs from 'fs'
import path from 'path'

import type { Application } from '../../declarations'
import type { Policies, PoliciesData, PoliciesPatch, PoliciesQuery } from './policies.schema'
import { AppDataModel } from '../app-data/app-data.schema'

export type { Policies, PoliciesData, PoliciesPatch, PoliciesQuery }

export interface PoliciesParams extends MongoDBAdapterParams<PoliciesQuery> {}

// ✅ helper function to calculate next version
function getNextVersion(filename: string): number {
  const match = filename.match(/_v(\d+)\.html$/)
  return match ? parseInt(match[1], 10) + 1 : 1
}

export class PoliciesService<ServiceParams extends Params = PoliciesParams> extends MongoDBService<
  Policies,
  PoliciesData,
  PoliciesParams,
  PoliciesPatch
> {
  // Custom find to only return policies
  async find(params?: PoliciesParams): Promise<any> {
    try {
      const query: any = { type: 'policy' }
      if (params?.query?._id) query._id = params.query._id

      const policies = await AppDataModel.find(query).lean()

      // Attach content by reading from file
      return policies.map((p: any) => {
        const filePath = path.join(__dirname, '../../../public', p.value?.url || '')
        try {
          p.content = fs.readFileSync(filePath, 'utf8')
        } catch {
          p.content = ''
        }
        return p
      })
    } catch (error) {
      throw error
    }
  }

  // Custom create with version control
  async create(data: any, params?: ServiceParams): Promise<any> {
    try {
      const { content, name } = data
      if (!content || !name) throw new Error('Content and name are required')

      // Check if policy exists
      const existing = await AppDataModel.findOne({ name, type: 'policy' }).lean()
      let version = 1

      if (existing?.value?.url) {
        version = getNextVersion(existing.value.url) // ✅ increment
      }

      // Define filename and path
      const safeName = name.replace(/\s+/g, '_').toLowerCase()
      const filename = `${safeName}_v${version}.html`
      const filePath = path.join(__dirname, '../../../public/policies', filename)

      // Ensure directory exists
      fs.mkdirSync(path.dirname(filePath), { recursive: true })

      // Write HTML content
      fs.writeFileSync(filePath, content, 'utf8')

      // Construct URL
      const fileUrl = `/policies/${filename}`

      // Save or update document
      const update = {
        name,
        type: 'policy',
        value: {
          url: fileUrl,
          version,
          lastUpdateAt: new Date(),
          lastUpdateBy: params?.user ? params.user._id : null
        }
      }

      const options = { upsert: true, new: true, setDefaultsOnInsert: true }
      const result = await AppDataModel.findOneAndUpdate({ name }, update, options)

      return { message: `Policy saved as version v${version}`, data: result }
    } catch (error) {
      console.error('Error saving policy:', error)
      throw error
    }
  }
}
export class PoliciesUserService<ServiceParams extends Params = PoliciesParams> extends MongoDBService<
  Policies,
  PoliciesData,
  PoliciesParams,
  PoliciesPatch
> {
  // Custom find to only return policies
  async find(params?: any): Promise<any> {
    try {
      const { policy } = params?.query ?? {}

      const policyData = await AppDataModel.findOne({ type: 'policy', name: policy }).lean()
      if (!policyData) throw new Error('Policy data not found!')

      let policyContent

      // Attach content by reading from file
      const filePath = path.join(__dirname, '../../../public', policyData.value?.url || '')

      try {
        policyContent = fs.readFileSync(filePath, 'utf8')
      } catch {
        policyContent = ''
      }

      return policyContent
    } catch (error) {
      throw error
    }
  }

  // Custom create with version control
}
export const getOptions = (app: Application): MongoDBAdapterOptions => {
  return {
    paginate: app.get('paginate'),
    Model: app.get('mongodbClient').then((db) => db.collection('policies'))
  }
}
