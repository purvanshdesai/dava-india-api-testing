import { EVENT_PROVIDER_PAYLOADS } from '../properties'

export const ALL_EVENT_PROVIDER_PAYLOADS: Record<string, Record<string, (payload: any) => any>> = {
  ...EVENT_PROVIDER_PAYLOADS
}
