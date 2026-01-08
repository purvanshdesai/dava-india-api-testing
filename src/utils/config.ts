var config: any

if (process.env.NODE_ENV === 'production') config = require('../../config/production.json')
else if (process.env.NODE_ENV === 'staging') config = require('../../config/staging.json')
else config = require('../../config/default.json')

export const appConfig = config
export const redisConfig = config.redis
export const appEnv = config.env

export const appEnvironments = {
  LOCAL: 'local',
  STAGING: 'staging',
  PRODUCTION: 'production'
}

export const davaCoinsConfig = {
  minimumOrderValue: 199,
  coinCreditPercentageForOrder: 20
}
