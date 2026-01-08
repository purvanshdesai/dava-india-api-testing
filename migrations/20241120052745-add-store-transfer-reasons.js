const { storeTransferReasons } = require('../seeds/appData')
module.exports = {
  async up(db, client) {
    // Add new data to the collection
    await db.collection('app-data').insertMany(storeTransferReasons)
  },

  async down(db, client) {
    await db.collection('app-data').deleteMany({ type: 'store-transfer-reason' })
  }
}
