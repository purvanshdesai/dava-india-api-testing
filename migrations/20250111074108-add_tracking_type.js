const { itemReturnReasons } = require('../seeds/appData')
module.exports = {
  async up(db, client) {
    await db.collection('order-item-tracking').updateMany(
      {}, // No filter, update all documents
      {
        $set: { type: 'order' } // Add discountType field
      }
    )

    await db.collection('app-data').insertMany(itemReturnReasons)
  },

  async down(db, client) {
    await db.collection('order-item-tracking').updateMany(
      {}, // No filter, update all documents
      {
        $unset: { type: 1 }
      }
    )

    await db.collection('app-data').deleteMany({ type: 'item-return-reason' })
  }
}
