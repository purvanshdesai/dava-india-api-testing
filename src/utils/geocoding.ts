import axios from 'axios'
import { appConfig } from './config'

interface GeocodeResult {
  latitude: number
  longitude: number
}

/**
 * Geocode a pincode using Google Geocoding API
 * @param pincode - The pincode to geocode (6 digits for Indian pincodes)
 * @param area - Optional area name to improve accuracy
 * @param district - Optional district name to improve accuracy
 * @param state - Optional state name to improve accuracy
 * @returns Promise with latitude and longitude coordinates
 */
export async function geocodePincode(
  pincode: string,
  area?: string,
  district?: string,
  state?: string
): Promise<GeocodeResult> {
  const apiKey = appConfig.googleMaps?.apiKey

  if (!apiKey) {
    throw new Error('Google Maps API key is not configured')
  }

  // Build address string for better accuracy
  const addressParts: string[] = []
  if (area) addressParts.push(area)
  if (district) addressParts.push(district)
  if (state) addressParts.push(state)
  addressParts.push(pincode)
  addressParts.push('India')

  const address = addressParts.join(', ')

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: apiKey,
        region: 'in' // Bias results to India
      }
    })

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location
      return {
        latitude: location.lat,
        longitude: location.lng
      }
    } else if (response.data.status === 'ZERO_RESULTS') {
      // If no results with full address, try with just pincode
      if (addressParts.length > 2) {
        const simpleAddress = `${pincode}, India`
        const retryResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
          params: {
            address: simpleAddress,
            key: apiKey,
            region: 'in'
          }
        })

        if (retryResponse.data.status === 'OK' && retryResponse.data.results.length > 0) {
          const location = retryResponse.data.results[0].geometry.location
          return {
            latitude: location.lat,
            longitude: location.lng
          }
        }
      }

      throw new Error(`No results found for pincode: ${pincode}`)
    } else {
      throw new Error(`Geocoding API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`)
    }
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Geocoding API request failed: ${error.response.status} - ${error.response.statusText}`)
    } else if (error.message) {
      throw error
    } else {
      throw new Error(`Failed to geocode pincode: ${pincode}`)
    }
  }
}

