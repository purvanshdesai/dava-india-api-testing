const { trackOrderStatuses } = require('../seeds/appData')
module.exports = {
  async up(db, client) {
    await db.collection('app-data').deleteMany({ type: 'order-tracking-status' })
    await db.collection('app-data').insertMany(trackOrderStatuses)
  },

  async down(db, client) {}
}
