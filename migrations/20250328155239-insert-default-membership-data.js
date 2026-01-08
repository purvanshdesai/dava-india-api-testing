module.exports = {
  async up(db, client) {
    // Example:
    await db
      .collection('users')
      .updateMany({}, { $set: { hasDavaoneMembership: false, davaCoinsBalance: 0 } })

    await db.collection('orders').updateMany({}, { $set: { hasMembershipFreeDeliveryBenefit: false } })
  },

  async down(db, client) {}
}
