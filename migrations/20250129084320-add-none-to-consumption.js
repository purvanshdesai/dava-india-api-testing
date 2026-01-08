module.exports = {
  async up(db, client) {
    const consumptions = [
      { type: 'consumption', value: 'none', label: 'None' },
      {
        type: 'consumption',
        value: 'non-consumable',
        label: 'Non Consumable'
      }
    ]
    // Delete documents with type: 'order-tracking-status'
    await db.collection('app-data').deleteMany({ type: 'consumption', value: 'none' })

    // Add new data to the collection

    await db.collection('app-data').insertMany(consumptions)
  },

  async down(db, client) {
    await db.collection('app-data').deleteMany({ type: 'consumption', value: 'none' })
  }
}
