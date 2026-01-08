module.exports = {
  async up(db, client) {
    await db.collection('stores').updateMany({}, [
      {
        $set: {
          logistics: {
            $mergeObjects: [
              '$logistics',
              {
                delhivery: { pickupLocation: '$storeName' }
              }
            ]
          }
        }
      }
    ])
  },

  async down(db, client) {}
}
