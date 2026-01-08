module.exports = {
  async up(db, client) {
    await db
      .collection('app-data')
      .updateOne({ statusCode: 'dispatched' }, { $set: { name: 'Order packed, ready to pick up' } })
  },

  async down(db, client) {
    await db.collection('app-data').updateOne({ statusCode: 'dispatched' }, { $set: { name: 'Dispatched' } })
  }
}
