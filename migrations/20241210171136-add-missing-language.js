module.exports = {
  async up(db, client) {
    await db.collection('app-data').deleteOne({
      type: 'language',
      name: 'Manipuri',
      code: 'mni',
      symbol: 'ꯃ'
    })

    // Insert the Bojpuri entry
    await db.collection('app-data').insertOne({
      type: 'language',
      name: 'Bhojpuri',
      code: 'boj',
      symbol: 'ब'
    })
  },

  async down(db, client) {
    // Insert the Bojpuri entry
    await db.collection('app-data').deleteOne({
      code: 'boj'
    })
  }
}
