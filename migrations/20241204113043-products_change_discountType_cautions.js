module.exports = {
  async up(db, client) {
    // Update all documents in the `products` collection
    await db.collection('products').updateMany(
      {}, // No filter, update all documents
      {
        $set: { discountType: 'flat' } // Add discountType field
      }
    )
  },

  async down(db, client) {}
}
