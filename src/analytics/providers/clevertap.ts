import { PROVIDER_NAMES } from '../constants/providerNames'
import axios from 'axios'
import { appConfig } from '../../utils/config'

const clevertapConfig = appConfig?.clevertap ?? {}

// ✅ Set your CleverTap credentials
const CLEVERTAP_ACCOUNT_ID = clevertapConfig.accountId
const CLEVERTAP_PASSCODE = clevertapConfig.passcode
const CLEVERTAP_REGION = clevertapConfig.region

const CLEVERTAP_BASE_URL = `https://${CLEVERTAP_REGION}.api.clevertap.com/1/upload`

const defaultIdentity = 'server@davaindia.com' // This will be used by default

console.log('✅ CleverTap Initialized with identity:', defaultIdentity)

const clevertapProvider = {
  name: PROVIDER_NAMES.CLEVERTAP,
  initServerProfile: async () => {
    const eventData = {
      d: [
        {
          identity: defaultIdentity,
          type: 'profile',
          profileData: {
            Name: 'Davaindia Server - API',
            Email: defaultIdentity,
            Phone: '+918471009009'
          }
        }
      ]
    }

    try {
      const response = await axios.post(CLEVERTAP_BASE_URL, eventData, {
        headers: {
          'X-CleverTap-Account-Id': CLEVERTAP_ACCOUNT_ID,
          'X-CleverTap-Passcode': CLEVERTAP_PASSCODE,
          'Content-Type': 'application/json; charset=utf-8'
        }
      })

      // console.log(`📤 CleverTap Event Init User  sent for ${defaultIdentity}`, response.data.unprocessed)
      return response.data
    } catch (error: any) {
      console.error('❌ CleverTap Event Init User Error:', error.response?.data || error.message)
    }
  },
  trackEvent: async (event: string, payload?: Record<string, any>) => {
    if (appConfig.env === 'local') return

    const eventData = {
      d: [
        {
          identity: defaultIdentity,
          ts: Math.floor(Date.now() / 1000), // time when the event occurred in UNIX epoch value in seconds
          type: 'event',
          evtName: event,
          evtData: payload
        }
      ]
    }

    try {
      const response = await axios.post(CLEVERTAP_BASE_URL, eventData, {
        headers: {
          'X-CleverTap-Account-Id': CLEVERTAP_ACCOUNT_ID,
          'X-CleverTap-Passcode': CLEVERTAP_PASSCODE,
          'Content-Type': 'application/json; charset=utf-8'
        }
      })

      // console.log(`📤 CleverTap Event [${event}] sent for ${defaultIdentity}`, response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ CleverTap Event Error:', error.response?.data || error.message)
    }
  }
}

if (appConfig.env !== 'local') clevertapProvider.initServerProfile()

export default clevertapProvider
