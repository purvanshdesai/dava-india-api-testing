import { providers as allProviders } from './providers/all'
import { ALL_EVENT_PROVIDER_MAP } from './events/eventProviderMap'
import { ALL_EVENT_PROVIDER_PAYLOADS } from './events/eventPayloadMap'
import { ALL, ALL_PROVIDERS, ProviderName, ProviderList } from './constants/providerNames'
import { AnalyticsTrackerHistorySchemaModel } from '../services/analytics-tracker-history/analytics-tracker-history.schema'

type AnalyticsProvider = {
  name: ProviderName
  trackEvent: (event: string, payload?: Record<string, any>) => void
}

const env = process.env.NEXT_PUBLIC_ENV

// const isDev = env === 'development'
const isStaging = env === 'staging'
const isProd = env === 'production'

const getEnabledProviders = (): AnalyticsProvider[] => {
  return isProd || isStaging ? allProviders : []
}

// TypeScript version — adapt types if needed
export async function trackEvent(event: string, payload: Record<string, any> = {}): Promise<void> {
  // Resolve routing / allowed providers
  const routingEntry: ProviderList | undefined = ALL_EVENT_PROVIDER_MAP[event]
  const allowedProviders: ProviderName[] =
    routingEntry === ALL || !routingEntry ? ALL_PROVIDERS : routingEntry

  // Get currently enabled providers (assumed to be synchronous)
  const activeProviders = getEnabledProviders()

  // Preload transformer map for the event (may be empty)
  const transformerMap = ALL_EVENT_PROVIDER_PAYLOADS?.[event] ?? {}

  // helper: safely stringify payload (avoids crashes on circular refs)
  const safeStringify = (obj: any) => {
    try {
      return JSON.stringify(obj)
    } catch {
      const seen = new WeakSet()
      return JSON.stringify(obj, (_key, value) => {
        if (value && typeof value === 'object') {
          if (seen.has(value)) return '[Circular]'
          seen.add(value)
        }
        return value
      })
    }
  }

  // Create tasks for each allowed provider
  const tasks = allowedProviders.map(async (providerName) => {
    const provider = activeProviders.find((p) => p.name === providerName)
    if (!provider) {
      // provider not enabled — not an error, just skip
      return { provider: providerName, status: 'skipped' as const }
    }

    // choose provider-specific transformer or fallback
    const transformer = transformerMap[provider.name] ?? transformerMap[ALL] ?? undefined

    // allow transformer to be sync or async — if it fails, fallback to original payload
    let finalPayload = payload
    if (transformer) {
      try {
        const maybeTransformed = transformer(payload || {})
        finalPayload = maybeTransformed instanceof Promise ? await maybeTransformed : maybeTransformed
      } catch (err) {
        console.warn(`[Analytics] transformer error for provider ${providerName}:`, err)
        finalPayload = payload
      }
    }

    // ensure provider has trackEvent method
    if (typeof provider.trackEvent !== 'function') {
      console.warn(`[Analytics] provider ${providerName} does not implement trackEvent — skipping`)
      return { provider: providerName, status: 'no-track-method' as const }
    }

    try {
      // call provider tracking (may be async)
      await provider.trackEvent(event, finalPayload)

      // persist history record — await so we know it completed (you can change to fire-and-forget)
      await AnalyticsTrackerHistorySchemaModel.create({
        provider: providerName,
        event,
        payload: safeStringify(finalPayload),
        createdAt: new Date(),
        updatedAt: new Date()
      })

      return { provider: providerName, status: 'ok' as const }
    } catch (error) {
      // per-provider error handling — do not fail other providers
      console.warn(`[Analytics Error] in ${providerName}:`, error)
      return { provider: providerName, status: 'error' as const, error }
    }
  })

  // Run all provider tasks in parallel but wait for all to settle.
  // Use allSettled so one provider's rejection doesn't reject the outer Promise.
  await Promise.allSettled(tasks)
}
