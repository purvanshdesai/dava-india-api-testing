module.exports = {
  async up(db, client) {
    const collection = db.collection('store-inventory')

    // Find duplicate entries grouped by storeId and productId
    const duplicates = await collection
      .aggregate([
        {
          $group: {
            _id: { storeId: '$storeId', productId: '$productId' },
            count: { $sum: 1 },
            docs: { $push: '$$ROOT' }
          }
        },
        {
          $match: {
            count: { $gt: 1 }
          }
        }
      ])
      .toArray()

    for (const duplicate of duplicates) {
      const docs = duplicate.docs

      // Separate documents into those with and without batches
      const withBatches = []
      const withoutBatches = []

      docs.forEach((doc) => {
        if (doc.batches && doc.batches.length > 0) {
          withBatches.push(doc)
        } else {
          withoutBatches.push(doc)
        }
      })

      if (withBatches.length > 0) {
        for (const doc of withoutBatches) {
          await collection.deleteOne({ _id: doc._id })
        }
      } else {
        for (let i = 1; i < docs.length; i++) {
          await collection.deleteOne({ _id: docs[i]._id })
        }
      }
    }
  },

  async down(db, client) {}
}
