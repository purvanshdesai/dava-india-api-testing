module.exports = {
  async up(db, client) {
    await db.collection('payments').updateMany({}, { $set: { paymentFor: 'order' } })
    await db.collection('refunds').updateMany({}, { $set: { paymentFor: 'order' } })
  },

  async down(db, client) {}
}
