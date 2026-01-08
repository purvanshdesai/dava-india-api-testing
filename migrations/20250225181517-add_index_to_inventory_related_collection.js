module.exports = {
  async up(db, client) {
    // Create an index on the 'sku' field in the 'products' collection

    const createProductIndex = async () => {
      const indexes = await db.collection('products').indexes()
      const hasIndex = indexes.some((index) => index.name === 'sku_1')

      if (!hasIndex) {
        await db.collection('products').createIndex({ sku: 1 })
      }
    }

    const createStoreIndex = async () => {
      const indexes = await db.collection('stores').indexes()
      const hasIndex = indexes.some((index) => index.name === 'storeCode_1')

      if (!hasIndex) {
        await db.collection('stores').createIndex({ storeCode: 1 })
      }
    }

    const createStoreInventoryIndex = async () => {
      const indexes = await db.collection('store-inventory').indexes()
      const hasStoreIdIndex = indexes.some((index) => index.name === 'storeId_1')
      const hasProductIdIndex = indexes.some((index) => index.name === 'productId_1')

      if (!hasStoreIdIndex) {
        await db.collection('store-inventory').createIndex({ storeId: 1 })
      }

      if (!hasProductIdIndex) {
        await db.collection('store-inventory').createIndex({ productId: 1 })
      }
    }

    await createProductIndex()
    await createStoreIndex()
    await createStoreInventoryIndex()
  },

  async down(db, client) {
    // Remove the index if the migration is rolled back
    await db
      .collection('products')
      .dropIndex('sku_1')
      .catch((err) => {
        console.log('Index does not exist, skipping drop:', err)
      })

    await db
      .collection('stores')
      .dropIndex('storeCode_1')
      .catch((err) => {
        console.log('Index does not exist, skipping drop:', err)
      })

    await db
      .collection('store-inventory')
      .dropIndex('storeId_1')
      .catch((err) => {
        console.log('Index does not exist, skipping drop:', err)
      })

    await db
      .collection('store-inventory')
      .dropIndex('productId_1')
      .catch((err) => {
        console.log('Index does not exist, skipping drop:', err)
      })
  }
}
