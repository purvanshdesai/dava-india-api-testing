module.exports = {
  async up(db, client) {
    await db.collection('products').updateMany({}, { $set: { saltType: 'None' } })
  },

  async down(db, client) {
    await db.collection('products').updateMany({}, { $unset: { saltType: 1 } })
  }
}
