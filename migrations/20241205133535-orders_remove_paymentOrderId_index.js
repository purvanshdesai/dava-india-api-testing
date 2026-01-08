module.exports = {
  async up(db, client) {
    await db.collection('orders').dropIndex('paymentOrderId_1')
  },

  async down(db, client) {}
}
