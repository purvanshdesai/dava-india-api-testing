module.exports = {
  async up(db, client) {
    const collectionName = 'store-inventory'

    // Fetch documents with string expiryDate
    const cursor = db.collection(collectionName).find({
      'batches.expiryDate': { $type: 'string' }
    })

    while (await cursor.hasNext()) {
      const doc = await cursor.next()

      // Transform expiryDate strings to Date objects
      const updatedBatches = doc.batches.map((batch) => {
        if (typeof batch.expiryDate === 'string') {
          const [day, month, year] = batch.expiryDate.split('-')
          const convertedDate = new Date(`${year}-${month}-${day}T00:00:00Z`)
          return { ...batch, expiryDate: convertedDate }
        }
        return batch // Keep unchanged if expiryDate is not a string
      })

      // Update the document
      await db.collection(collectionName).updateOne({ _id: doc._id }, { $set: { batches: updatedBatches } })
    }
  },

  async down(db, client) {}
}
