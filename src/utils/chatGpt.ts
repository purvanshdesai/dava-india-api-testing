import axios from 'axios'
import Redis from 'ioredis'
// import redisClient from '../../src/cache/redis/index'

import { appConfig } from '../utils/config'

const config = appConfig.redis
let gptAccounts = appConfig.gptAccounts

const redisClient = new Redis({
  host: config.host,
  port: config.port
})

gptAccounts = gptAccounts.map((account: any) => ({
  apiKey: account,
  tokenLimit: 1000000, // Replace with your actual token limit
  rateLimit: {
    windowMs: 60000, // 1-minute window
    maxRequests: 600 // Max 600 requests per minute
  }
}))

async function getTokensRemaining(apiKey: string) {
  const tokensRemaining: any = await redisClient.hget(`account:${apiKey}`, 'tokensRemaining')
  return parseInt(tokensRemaining) || 0
}

async function getRateLimitInfo(apiKey: string) {
  const rateLimitRemaining: any = await redisClient.hget(`account:${apiKey}`, 'rateLimitRemaining')
  const rateLimitReset: any = await redisClient.hget(`account:${apiKey}`, 'rateLimitReset')

  return {
    rateLimitRemaining: parseInt(rateLimitRemaining) || 0,
    rateLimitReset: parseInt(rateLimitReset) || 0
  }
}

export async function initializeGptAccountsInRedis() {
  for (const account of gptAccounts) {
    const existsInRedis = await redisClient.exists(`account:${account.apiKey}`)
    if (!existsInRedis) {
      await redisClient.hmset(`account:${account.apiKey}`, {
        apiKey: account.apiKey,
        tokenLimit: account.tokenLimit,
        rateLimit: JSON.stringify(account.rateLimit),
        tokensRemaining: account.tokenLimit
      })
    }
  }
}

export async function makeChatGptApiCall(apiKey: string, messages: any) {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        messages,
        model: 'gpt-4o-mini'
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    )
    const rateLimitRemaining = response.headers['x-ratelimit-remaining-requests']
    const rateLimitReset = response.headers['x-ratelimit-reset-requests']
    const tokensRemaining = response.headers['x-ratelimit-remaining-tokens']

    if (apiKey) {
      await redisClient.hmset(`account:${apiKey}`, {
        rateLimitRemaining,
        rateLimitReset,
        tokensRemaining
      })
    }

    return { response, tokensRemaining }
  } catch (error) {
    console.error(error)
    throw error
  }
}

export async function getGptAccountsFromRedis() {
  const keys = await redisClient.keys('account:*')
  const accounts = []

  for (const key of keys) {
    const account = await redisClient.hgetall(key)
    accounts.push(account)
  }

  return accounts
}

export async function getOptimalGptAccount(inputText: string) {
  const gptAccountsFromRedis = await getGptAccountsFromRedis()

  let optimalAccount = null
  let minTokensRemaining = Infinity

  for (const account of gptAccountsFromRedis) {
    const tokensRemaining = await getTokensRemaining(account.apiKey)
    const rateLimitInfo = await getRateLimitInfo(account.apiKey)

    // Calculate a score for each account based on tokens remaining and rate limit status
    const score = tokensRemaining + rateLimitInfo.rateLimitRemaining * 1000

    if (score < minTokensRemaining) {
      optimalAccount = account
      minTokensRemaining = score
    }
  }

  return optimalAccount
}
