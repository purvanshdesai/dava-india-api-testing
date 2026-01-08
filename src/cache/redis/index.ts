import Redis from 'ioredis'

import { appConfig } from '../../utils/config'

const config = appConfig.redis

class RedisCache {
  redis: Redis | undefined
  static _instance: typeof RedisCache

  constructor() {
    if (RedisCache._instance instanceof RedisCache) {
      return RedisCache._instance
    }

    this.redis = new Redis({
      host: config.host,
      port: config.port
    })

    RedisCache._instance = RedisCache
  }

  getInstance() {
    if (!this.redis) {
      this.redis = new Redis({
        host: config.host,
        port: config.port
      })
    }
    return this.redis
  }
}

export default new RedisCache()
