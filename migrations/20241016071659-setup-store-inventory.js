module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
    const cursor = await db.collection('products').find({})

    for await (const doc of cursor) {
      const cursorStore = await db.collection('stores').find({})

      for await (const docStore of cursorStore) {
        await db.collection('store-inventory').insertOne({
          storeId: docStore._id,
          productId: doc?._id,
          stock: 30
        })
      }
    }
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
    await db.collection('store-inventory').deleteMany({})
  }
}
