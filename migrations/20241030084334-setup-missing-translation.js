module.exports = {
  async up(db, client) {
    const languages = [
      {
        type: 'language',
        name: 'Assamese',
        code: 'as',
        symbol: 'অ'
      },
      {
        type: 'language',
        name: 'Nepali',
        code: 'ne',
        symbol: 'अ'
      },
      {
        type: 'language',
        name: 'Manipuri',
        code: 'mni',
        symbol: 'ꯃ'
      }
    ]

    await db.collection('app-data').insertMany(languages)
  },

  async down(db, client) {
    await db.collection('app-data'.deleteMany({}))
  }
}
