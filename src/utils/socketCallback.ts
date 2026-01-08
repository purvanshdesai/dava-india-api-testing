import { Server } from 'http'

export const socketCallback = (io: any) => {
  io.on('connection', (socket: any) => {})

  io.use(function (socket: any, next: any) {
    // Exposing a request property to services and hooks
    socket.feathers.referrer = socket.request.referrer
    next()
  })
}
