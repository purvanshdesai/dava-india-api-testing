import { Server, Socket } from 'socket.io'
import Logistics, { AVAILABLE_LOGISTICS } from '../utils/logistics/Logistics'
import { ShiprocketQuick } from '../utils/logistics/ShiprocketQuick'

type RiderLocation = {
  status?: string
  [key: string]: any
}

const pollingIntervalMs = 30000

const EVENTS = {
  RIDER_UPDATE: 'rider:update',
  TRACKING_ERROR: 'tracking:error'
}

export function orderTrackerManager(io: Server) {
  const activeIntervals = new Map<string, NodeJS.Timeout>()

  io.on('connection', (socket: Socket) => {
    const shipmentId = socket.handshake.query.shipmentId as string | undefined

    if (!shipmentId) {
      socket.emit(EVENTS.TRACKING_ERROR, {
        message: 'Shipment ID is required for tracking.'
      })
      socket.disconnect()
      return
    }

    console.log(`Client connected: ${socket.id} for shipment ${shipmentId}`)

    const sendLocation = async () => {
      try {
        const rider: RiderLocation = await (
          Logistics.getAggregator(AVAILABLE_LOGISTICS.SHIPROCKET_QUICK) as ShiprocketQuick
        ).fetchRiderLocation(shipmentId)

        socket.emit(EVENTS.RIDER_UPDATE, rider)

        if (rider?.status?.toLowerCase() === 'delivered') {
          clearFetch()
        }
      } catch (error: any) {
        console.error('Failed to fetch rider location', error.message)
        socket.emit(EVENTS.TRACKING_ERROR, {
          message: 'Unable to fetch rider location right now.'
        })
      }
    }

    // Send first update
    sendLocation()

    // Create interval for continuous updates
    const intervalId = setInterval(sendLocation, pollingIntervalMs)
    activeIntervals.set(socket.id, intervalId)

    const clearFetch = () => {
      const tracker = activeIntervals.get(socket.id)
      if (tracker) {
        clearInterval(tracker)
        activeIntervals.delete(socket.id)
      }

      console.log('Clearing order fetch =====>')
    }

    socket.on('disconnect', () => {
      clearFetch()
      console.log(`Client disconnected: ${socket.id}`)
    })
  })
}

export default orderTrackerManager
