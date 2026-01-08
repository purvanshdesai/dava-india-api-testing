// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Id, NullableId, Params, ServiceInterface } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import { installReferrerTrackerLogger } from '../../logger'

type AppInstallReferrerTracker = any
type AppInstallReferrerTrackerData = any
type AppInstallReferrerTrackerPatch = any
type AppInstallReferrerTrackerQuery = any

export type {
  AppInstallReferrerTracker,
  AppInstallReferrerTrackerData,
  AppInstallReferrerTrackerPatch,
  AppInstallReferrerTrackerQuery
}

export type TrackPayload = {
  packageName: string
  eventType: string // attempt_query | referrer_received | parsed_utm | ...
  timestampISO?: string
  installSessionId?: string
  installReferrerRaw?: string | null
  utmParams?: Record<string, string | undefined> | null
  message?: string | null
  extra?: Record<string, any> | null
}

export interface AppInstallReferrerTrackerServiceOptions {
  app: Application
}

export interface AppInstallReferrerTrackerParams extends Params<AppInstallReferrerTrackerQuery> {}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class AppInstallReferrerTrackerService<
  ServiceParams extends AppInstallReferrerTrackerParams = AppInstallReferrerTrackerParams
> implements
    ServiceInterface<
      AppInstallReferrerTracker,
      AppInstallReferrerTrackerData,
      ServiceParams,
      AppInstallReferrerTrackerPatch
    >
{
  constructor(public options: AppInstallReferrerTrackerServiceOptions) {}

  // Accept create (POST) to log incoming payloads
  async create(data: TrackPayload, params?: Params): Promise<{ ok: boolean; logged: boolean }> {
    try {
      // sanitize / normalize timestamp
      const timestamp = data.timestampISO ?? new Date().toISOString()

      // build structured log entry
      const logEntry = {
        packageName: data.packageName ?? 'unknown',
        eventType: data.eventType ?? 'unknown',
        timestamp,
        installSessionId: data.installSessionId ?? null,
        installReferrerRaw: data.installReferrerRaw ?? null,
        utmParams: data.utmParams ?? null,
        message: data.message ?? null,
        extra: data.extra ?? null,
        // add request metadata if available (feathers params.transport / provider)
        provider: params?.provider ?? null,
        ip: (params && (params as any).connection?.remoteAddress) || (params && (params as any).ip) || null
      }

      // Use structured info-level log
      installReferrerTrackerLogger.info(`Install Referrer Log: ${JSON.stringify(logEntry, null, 2)}`)

      // optionally also store in memory/DB: omitted here
      return { ok: true, logged: true }
    } catch (err) {
      installReferrerTrackerLogger.error(`Request Error: ${JSON.stringify(err)}`)
      throw err
    }
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
