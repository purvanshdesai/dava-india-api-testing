import { PREFIXES } from './prefixes'
import Redis from './'
import JSONCache from 'redis-json'
import LogisticsAggregator from '../../utils/logistics/Logistics'
import { CourierPartner } from '../../utils/logistics/types'
import { Shiprocket } from '../../utils/logistics/Shiprocket'

const cacheKey = 'couriers'
const partner = 'shiprocket'

class Couriers {
  static _instance: typeof Couriers
  jsonCache: any

  constructor() {
    if (Couriers._instance instanceof Couriers) return Couriers._instance

    this.jsonCache = new JSONCache(Redis.redis, {
      prefix: PREFIXES.SUPPORTED_LOGISTICS_COURIERS
    })

    Couriers._instance = this.jsonCache
  }

  async getCouriersFromCache(): Promise<CourierPartner[] | null> {
    const cached = await this.jsonCache.get(cacheKey)

    // console.log('Cache Found for shiprocket couriers', cached)

    if (cached) return cached as CourierPartner[]

    // Cache miss: Fetch from database
    // console.log('Cache miss. Fetching couriers from Shiprocket API...')
    const couriers: any = await this.fetchCouriersForCache()

    if (couriers?.length) {
      // Add to cache with validation
      await this.setCouriersInCache(couriers)
    }

    return couriers
  }

  async setCouriersInCache(couriers: CourierPartner): Promise<void> {
    // if (await this.validatePromotion(productData)) {
    await this.jsonCache.set(cacheKey, couriers ?? [], { EX: 3600 })
    await this.setTTL()

    // console.log(`Couriers added to cache.`)
  }

  async fetchCouriersForCache() {
    // Fetch from ShipRocket
    return await (LogisticsAggregator.getAggregator(partner) as Shiprocket).listOfSupportedCouriers()
  }

  async setTTL() {
    const redis = Redis.getInstance()

    // Set TTL for the key (in seconds)
    const ttlInSeconds = 3600 // 1 hour
    await redis.expire(cacheKey, ttlInSeconds)

    // Verify the TTL
    // const ttl = await redis.ttl(cacheKey)
    // console.log(`TTL for ${cacheKey}: ${ttl} seconds`)
  }
}

export default new Couriers()
