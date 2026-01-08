module.exports = {
  async up(db, client) {
    // Remove all collections
    await db.collection('collections').deleteMany({})
    // Remove all navigations
    await db.collection('navigations').deleteMany({})

    // Fetch all products
    const categories = await db.collection('categories').find({}).toArray()

    const collectionsData = categories.map((c) => {
      return {
        name: c.name,
        description: c.description,
        slugUrl:
          !c.slugUrl || !c.slugUrl?.length
            ? c.name
                .toLowerCase() // Convert to lowercase
                .trim() // Remove leading and trailing whitespace
                .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .replace(/-+/g, '-') // Collapse multiple hyphens
            : c.slugUrl,
        isActive: true,
        translations: c.translations,
        image: c.image,
        categoryId: c._id
      }
    })

    await db.collection('collections').insertMany(collectionsData)

    const collections = await db.collection('collections').find({}).toArray()

    const products = await db.collection('products').find({}).toArray()

    const categoryCollectionMap = collections.reduce((acc, c) => {
      acc[c.categoryId] = c._id
      return acc
    }, {})

    await Promise.all(
      products.map(async (p) => {
        const collectionId = categoryCollectionMap[p.subCategoryId]
        await db
          .collection('products')
          .updateOne({ _id: p._id }, { $set: { collections: collectionId ? [collectionId] : [] } })
      })
    )

    await db.collection('collections').updateMany({}, { $unset: { categoryId: '' } })
  },

  async down(db, client) {
    await db.collection('collections').deleteMany({})
  }
}
