import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { requestsLogger } from '../logger'

// Helper function to generate curl command from axios config
const generateCurlCommand = (config: any): string => {
  const { method = 'GET', url, headers = {}, data } = config

  let curlCommand = `curl -X ${method.toUpperCase()} '${url}'`

  // Add headers
  Object.entries(headers).forEach(([key, value]) => {
    if (key.toLowerCase() !== 'content-length') {
      curlCommand += ` \\\n  -H '${key}: ${value}'`
    }
  })

  // Add data/body if present
  if (data) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data)
    curlCommand += ` \\\n  -d '${dataString}'`
  }

  return curlCommand
}

// Create an Axios instance
const apiClient = axios.create()

// Axios request interceptor
apiClient.interceptors.request.use(
  (config: any) => {
    // Generate a unique correlation ID for this request
    const correlationId = uuidv4()

    // Generate curl command for the request
    const curlCommand = generateCurlCommand(config)

    // Attach metadata to the config for use in the response
    config.metadata = {
      correlationId,
      requestDetails: {
        method: config.method,
        url: config.url,
        headers: config.headers,
        data: config.data
      },
      startTime: new Date()
    }
    requestsLogger.info(`Request-CURL Log: ${JSON.stringify(curlCommand, null, 2)}`)
    return config
  },
  (error: any) => {
    requestsLogger.error(`Request Error: ${JSON.stringify(error)}`)
    return Promise.reject(error)
  }
)

// Axios response interceptor
apiClient.interceptors.response.use(
  (response: any) => {
    const { metadata } = response.config
    const { correlationId, requestDetails, startTime } = metadata

    // Collect request and response details
    const logDetails = {
      correlationId,
      request: requestDetails,
      response: {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      },
      duration: `${Date.now() - startTime}ms`
    }

    // Log the merged details
    requestsLogger.info(`Request-Response Log: ${JSON.stringify(logDetails, null, 2)}`)

    return response
  },
  (error: any) => {
    const { metadata } = error.config || {}
    const correlationId = metadata?.correlationId || 'unknown'
    const requestDetails = metadata?.requestDetails || 'unknown'
    const startTime = metadata?.startTime || new Date()

    // Collect request and error details
    const logDetails = {
      correlationId,
      request: requestDetails,
      error: {
        message: error.message,
        stack: error.stack,
        response: error.response?.data || 'No response data'
      },
      duration: `${Date.now() - startTime}ms`
    }

    // Log the merged details
    requestsLogger.error(`Request-Error Log: ${JSON.stringify(logDetails, null, 2)}`)

    return Promise.reject(error)
  }
)

export default apiClient
