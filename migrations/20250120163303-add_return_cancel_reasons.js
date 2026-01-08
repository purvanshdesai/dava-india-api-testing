const { itemReturnReasons, itemCancelReasons } = require('../seeds/appData')
module.exports = {
  async up(db, client) {
    await db.collection('app-data').deleteMany({ type: 'item-return-reason' })
    await db.collection('app-data').insertMany(itemReturnReasons)
    await db.collection('app-data').insertMany(itemCancelReasons)
  },

  async down(db, client) {
    await db.collection('app-data').deleteMany({ type: 'item-cancel-reason' })
  }
}
