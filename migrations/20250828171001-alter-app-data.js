const { trackOrderStatuses } = require('../seeds/appData')

module.exports = {
  async up(db, client) {
    // Delete documents with type: 'order-tracking-status'
    await db.collection('app-data').deleteMany({ type: 'order-tracking-status' })

    // Add new data to the collection
    const newOrderTrackingStatuses = trackOrderStatuses

    await db.collection('app-data').insertMany(newOrderTrackingStatuses)
  },

  async down(db, client) {
    await db.collection('app-data').deleteMany({ type: 'order-tracking-status' })
  }
}
