module.exports = {
  async up(db, client) {
    // Convert `aboutProduct.cautions` field to an array of strings with a blank array as the value
    // await db.collection('products').updateMany(
    //   {
    //     'aboutProduct.cautions': { $type: 'string' } // Filter only documents where cautions is a string
    //   },
    //   {
    //     $set: { 'aboutProduct.cautions': [] } // Set cautions to an empty array
    //   }
    // )
  },

  async down(db, client) {}
}
