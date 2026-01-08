// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../../declarations'
import type {
  ProductBulkUpload,
  ProductBulkUploadData,
  ProductBulkUploadPatch,
  ProductBulkUploadQuery
} from './product-bulk-upload.schema'

import { TaxesModel } from '../../taxes/taxes.schema'
import { ProductsModel } from '../../super-admin/products/products.schema'

export type { ProductBulkUpload, ProductBulkUploadData, ProductBulkUploadPatch, ProductBulkUploadQuery }

export interface ProductBulkUploadServiceOptions {
  app: Application
}
const products: any[] = []

export interface ProductBulkUploadParams extends Params<ProductBulkUploadQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class ProductBulkUploadService<ServiceParams extends ProductBulkUploadParams = ProductBulkUploadParams>
  implements
    ServiceInterface<ProductBulkUpload, ProductBulkUploadData, ServiceParams, ProductBulkUploadPatch>
{
  constructor(public options: ProductBulkUploadServiceOptions) {}

  async create(data: any, params?: ServiceParams): Promise<any> {
    try {
      const out = await this.updateProducts(products, { batchSize: 1000, dryRun: false })
      console.log('Update finished', JSON.stringify(out, null, 2))
      return out
    } catch (e) {
      console.error('Error running update:', e)
      throw e
    }
  }

  /**
   * safeParseNumber - parse numbers from strings like '159', '187.5', '0'
   */
  safeParseNumber(v: string) {
    if (v === null || v === undefined) return 0
    if (typeof v === 'number') return v
    const cleaned = String(v).replace(/,/g, '').trim()
    const n = parseFloat(cleaned)
    return Number.isFinite(n) ? n : 0
  }

  /**
   * dedupeByHighestMrp
   * groups incoming products by productSKU and keeps record with highest newMRP
   * @param {Array<Object>} incomingProducts
   * @returns {Array<Object>} deduped array
   */
  dedupeByHighestMrp(incomingProducts: any[]) {
    const map = new Map() // sku -> record with highest mrp
    for (const rec of incomingProducts) {
      const sku = String(rec.productSKU ?? rec.sku ?? '').trim()
      if (!sku) continue
      const mrp = this.safeParseNumber(rec.newMRP)
      if (!map.has(sku)) {
        map.set(sku, { ...rec, _parsedMRP: mrp })
        continue
      }
      const existing = map.get(sku)
      // if current mrp > existing parsed mrp, replace
      if (mrp > (existing._parsedMRP ?? 0)) {
        map.set(sku, { ...rec, _parsedMRP: mrp })
      }
      // if equal, keep existing (or change to rec if you prefer)
    }
    // return array without the helper field
    return Array.from(map.entries()).map(([sku, r]) => {
      const { _parsedMRP, ...orig } = r
      return orig
    })
  }

  /**
   * updateProducts - main function
   * @param {Array<Object>} incomingProducts
   * @param {Object} options { batchSize = 1000, dryRun = false }
   */
  async updateProducts(incomingProducts: any[], options: any) {
    const batchSize = options.batchSize || 1000
    const dryRun = !!options.dryRun

    if (!Array.isArray(incomingProducts) || incomingProducts.length === 0) {
      return { ok: true, message: 'No products to process' }
    }

    // 1) dedupe by sku, selecting highest newMRP record
    const deduped = this.dedupeByHighestMrp(incomingProducts)

    // 2) collect GST rates from deduped (strip %)
    const gstSet = new Set()
    for (const p of deduped) {
      if (!p?.newGST) continue
      const rate = String(p.newGST).replace('%', '').trim()
      if (rate !== '') gstSet.add(rate)
    }
    const gstRates = Array.from(gstSet)

    const taxesDocs = gstRates.length > 0 ? await TaxesModel.find({ rate: { $in: gstRates } }).lean() : []

    const rateToTaxId = new Map()
    for (const t of taxesDocs) {
      rateToTaxId.set(String(t.rate).trim(), t._id)
    }

    const bulkOps = []
    const summary: Record<string, string> | any = {
      inputCount: incomingProducts.length,
      dedupedCount: deduped.length,
      missingTaxForRates: new Set(),
      opsPrepared: 0
    }

    for (const p of deduped) {
      const sku = String(p.productSKU ?? p.sku ?? '').trim()
      if (!sku) continue

      const mrp = this.safeParseNumber(p.newMRP)
      const unitPrice = this.safeParseNumber(p.unitPrice)
      const rawRate = String(p.newGST ?? '')
        .replace('%', '')
        .trim()
      const taxId = rateToTaxId.get(rawRate)

      if (!taxId) {
        summary.missingTaxForRates.add(rawRate || '(empty)')
      }

      // Build set object
      const setObj: Record<string, string> | any = {
        unitPrice: unitPrice,
        maximumRetailPrice: mrp
      }
      if (taxId) setObj.taxes = [taxId]

      // Use update pipeline to compute finalPrice = maximumRetailPrice - discount (discount from DB)
      const updatePipeline = [
        {
          $set: {
            ...setObj,
            finalPrice: {
              $subtract: [
                mrp,
                { $ifNull: ['$discount', 0] } // uses existing discount field in DB
              ]
            }
          }
        }
      ]

      bulkOps.push({
        updateOne: {
          filter: { sku },
          update: updatePipeline,
          upsert: false
        }
      })

      summary.opsPrepared++
    }

    summary.missingTaxForRates = Array.from(summary.missingTaxForRates)

    if (dryRun) {
      return {
        ok: true,
        dryRun: true,
        summary,
        sampleDeduped: deduped.slice(0, 5),
        sampleOps: bulkOps.slice(0, 5)
      }
    }

    // Execute bulkOps in batches
    const results: any = { totalOps: summary.opsPrepared, batches: [], errors: [] }
    for (let i = 0; i < bulkOps.length; i += batchSize) {
      const chunk = bulkOps.slice(i, i + batchSize)
      try {
        const res = await ProductsModel.bulkWrite(chunk, { ordered: false })
        results.batches.push({
          batchIndex: Math.floor(i / batchSize),
          ops: chunk.length,
          result: res
        })
      } catch (err: any) {
        results.errors.push({
          batchIndex: Math.floor(i / batchSize),
          message: err.message,
          error: err
        })
      }
    }

    return { ok: true, summary, results }
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
