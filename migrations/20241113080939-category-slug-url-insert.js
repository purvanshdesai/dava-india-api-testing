module.exports = {
  async up(db, client) {
    db.collection('categories').updateMany(
      {}, // Match all documents
      [
        {
          $set: {
            slugUrl: {
              $replaceAll: {
                input: { $toLower: { $trim: { input: '$seo.url' } } },
                find: ' ',
                replacement: '-'
              }
            }
          }
        }
      ]
    )
  },

  async down(db, client) {
    db.collection('categories').updateMany(
      {}, // Match all documents
      [{ $set: { slugUrl: '' } }]
    )
  }
}
