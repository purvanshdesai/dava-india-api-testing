const { itemCancelReasons } = require('../seeds/appData')

module.exports = {
  async up(db, client) {
    await db.collection('app-data').deleteMany({ type: 'item-cancel-reason' })
    if (Array.isArray(itemCancelReasons) && itemCancelReasons.length) {
      await db.collection('app-data').insertMany(itemCancelReasons)
    }
  },

  async down(db, client) {
    await db.collection('app-data').deleteMany({ type: 'item-cancel-reason' })
  }
}
