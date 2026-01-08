const { consumptions } = require('../seeds/appData')

module.exports = {
  async up(db, client) {
    // Delete documents with type: 'order-tracking-status'
    await db.collection('app-data').deleteMany({ type: 'consumption' })

    // Add new data to the collection

    await db.collection('app-data').insertMany(consumptions)
  },

  async down(db, client) {
    await db.collection('app-data').deleteMany({ type: 'consumption' })
  }
}
