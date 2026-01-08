const { translations } = require('../seeds/translations')

module.exports = {
  async up(db, client) {
    await db.collection('i18n-settings').deleteMany({})
    await db.collection('i18n-settings').insertMany(translations)
  },

  async down(db, client) {
    await db.collection('i18n-settings').deleteMany({})
  }
}
