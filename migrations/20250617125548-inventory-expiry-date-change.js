module.exports = {
  async up(db, client) {
    const oldDate = new Date('1970-01-01T00:00:00.000Z')
    const newDate = new Date('2025-12-30T00:00:00.000Z')

    // Use updateMany with $set and arrayFilters
    await db.collection('store-inventory').updateMany(
      {
        'batches.expiryDate': oldDate
      },
      {
        $set: {
          'batches.$[elem].expiryDate': newDate
        }
      },
      {
        arrayFilters: [{ 'elem.expiryDate': oldDate }]
      }
    )
  },

  async down(db, client) {
    const rollbackDate = new Date('2025-12-30T00:00:00.000Z')
    const originalDate = new Date('1970-01-01T00:00:00.000Z')

    await db.collection('store-inventory').updateMany(
      {
        'batches.expiryDate': rollbackDate
      },
      {
        $set: {
          'batches.$[elem].expiryDate': originalDate
        }
      },
      {
        arrayFilters: [{ 'elem.expiryDate': rollbackDate }]
      }
    )
  }
}
