module.exports = {
  async up(db, client) {
    await db.collection('products').updateMany(
      { discount: { $gt: 0 } }, // your filter
      [
        { $set: { finalPrice: '$maximumRetailPrice' } } // <- pipeline form (field ref)
      ]
    )
  },

  async down(db, client) {
    // rollback: remove finalPrice for the same filter (or remove for all if you prefer)
    // await db.collection('products').updateMany({ discount: { $gt: 0 } }, { $unset: { finalPrice: '' } })
  }
}
