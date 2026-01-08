// 20250903100000-update-expired-batches.js

module.exports = {
  async up(db, client) {
    const filterDate = new Date('2000-01-01T00:00:00.000Z')
    const newExpiryDate = new Date('2026-09-30T00:00:00.000Z')

    // Update all batches inside the array with expiryDate < 2000
    await db.collection('store-inventory').updateMany(
      { 'batches.expiryDate': { $lt: filterDate } },
      {
        $set: { 'batches.$[elem].expiryDate': newExpiryDate }
      },
      {
        arrayFilters: [{ 'elem.expiryDate': { $lt: filterDate } }],
        multi: true
      }
    )
  },

  async down(db, client) {
    // ⚠️ Irreversible: you can’t restore original expiry dates.
    // Optionally, you can set them back to null for rollback.
    const filterDate = new Date('2026-09-30T00:00:00.000Z')

    await db.collection('store-inventory').updateMany(
      { 'batches.expiryDate': filterDate },
      {
        $set: { 'batches.$[elem].expiryDate': null }
      },
      {
        arrayFilters: [{ 'elem.expiryDate': filterDate }],
        multi: true
      }
    )
  }
}
