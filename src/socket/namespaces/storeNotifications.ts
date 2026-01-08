export const storeNotifications = (namespace: any) => {
  namespace.on('connection', (socket: any) => {
    console.log(`Store admin connected to storeNotifications: ${socket.id}`)

    // Listen to a store-specific event
    socket.on('storeUpdate', (data: any) => {
      console.log(`Store Update:`, data)
      socket.broadcast.emit('storeUpdate', data)
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Store admin disconnected from storeNotifications: ${socket.id}`)
    })
  })
}
