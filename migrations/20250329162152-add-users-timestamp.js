const collectionName = 'users'

module.exports = {
  async up(db, client) {
    await db.collection(collectionName).updateMany({}, [
      {
        $set: {
          createdAt: { $toDate: '$_id' }, // Convert `_id` to a Date
          updatedAt: { $toDate: '$_id' } // Convert `_id` to a Date
        }
      }
    ])
  },

  async down(db, client) {
    await db.collection(collectionName).updateMany(
      {},
      { $unset: { createdAt: '', updatedAt: '' } } // Remove the `createdAt` field in case of rollback
    )
  }
}
