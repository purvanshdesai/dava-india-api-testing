const { molecules, languages, trackOrderStatuses } = require('../seeds/appData')

module.exports = {
  async up(db, client) {
    const payload = [
      ...languages.map((l) => {
        return { ...l, type: 'language' }
      }),
      ...molecules.map((l) => {
        return { ...l, type: 'molecule' }
      }),
      ...trackOrderStatuses.map((l) => {
        return { ...l, type: 'order-tracking-status' }
      })
    ]

    // Insert the data into the collection
    await db.collection('app-data').insertMany(payload)
  },

  async down(db, client) {
    await db.collection('app-data').deleteMany({})
  }
}
