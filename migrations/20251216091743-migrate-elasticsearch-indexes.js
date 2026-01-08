const axios = require('axios')

var config

if (process.env.NODE_ENV === 'production') config = require('../config/production.json')
else if (process.env.NODE_ENV === 'staging') config = require('../config/staging.json')
else config = require('../config/default.json')

const elastic = config.elastic
const indexName = elastic.productsDb

const options = {
  mappings: {
    properties: {
      title: {
        type: 'search_as_you_type'
      },
      sku: { type: 'text' },
      productId: { type: 'text' },
      description: { type: 'text', analyzer: 'standard' },
      thumbnail: { type: 'text' },
      slugUrl: { type: 'text' },
      unitPrice: { type: 'float' },
      maximumRetailPrice: { type: 'float' },
      discount: { type: 'float' },
      finalPrice: { type: 'float' },
      minOrderQuantity: { type: 'float' },
      maxOrderQuantity: { type: 'float' },
      searchSuggestionKeywords: { type: 'search_as_you_type' },
      compositions: { type: 'search_as_you_type' },
      brandTags: { type: 'search_as_you_type' },
      prescriptionReq: { type: 'boolean' },
      isActive: { type: 'boolean' },
      saltType: { type: 'float' },
      collections: { type: 'text' }
    }
  }
}

module.exports = {
  async up(db, client) {
    const elasticsearch = axios.create({
      baseURL: elastic?.url, // replace with your Elasticsearch URL
      headers: { 'Content-Type': 'application/json' }
    })

    // Delete products index
    try {
      const response = await elasticsearch.delete(`/${indexName}`)
      console.log('Index deleted:', response.data)
    } catch (error) {
      console.error('Error deleting index:', error.response?.data)
    }

    // Create Index
    try {
      const response = await elasticsearch.put(`/${indexName}`, options)
      console.log('Index created:', response.data)
    } catch (error) {
      console.error('Error creating index:', error.response?.data)
    }

    // Fetch all products
    const products = await db
      .collection('products')
      .find({ $or: [{ deleted: false }, { deleted: { $exists: false } }] })
      .toArray()

    const collectionsMap = await db
      .collection('collections')
      .find({})
      .toArray()
      .then((docs) =>
        docs.reduce((acc, col) => {
          acc[col._id.toString()] = col
          return acc
        }, {})
      )

    // Populate collections in products
    const populatedProducts = products.map((product) => ({
      ...product,
      collections: (product.collections || [])
        .map((colId) => collectionsMap[colId.toString()] || null)
        .filter(Boolean)
    }))

    const bulkData = populatedProducts.map((p) => getEsProductDocPayload(p))

    const bulkRequestBody =
      bulkData
        .map((doc) => {
          const actionMetaData = JSON.stringify({ index: { _index: indexName, _id: doc.productId } })
          const documentData = JSON.stringify(doc) // Document to be indexed
          return `${actionMetaData}\n${documentData}`
        })
        .join('\n') + '\n' // Ensure newline at the end of the payload

    try {
      const response = await elasticsearch.post('/_bulk', bulkRequestBody, {
        headers: { 'Content-Type': 'application/x-ndjson' }
      })
      console.log('Bulk insert completed:', response.data)
    } catch (error) {
      console.error('Error in bulk insert:', error)
    }
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
}

const getEsProductDocPayload = (data) => {
  return {
    productId: data._id.toString(),
    title: data?.title,
    sku: data?.sku,
    description: data?.description,
    thumbnail: data?.thumbnail ?? '',
    slugUrl: data?.seo?.url,
    unitPrice: data?.unitPrice ?? 0,
    maximumRetailPrice: data?.maximumRetailPrice ?? 0,
    discount: data?.discount ?? 0,
    finalPrice: data?.finalPrice ?? 0,
    searchSuggestionKeywords: data?.tags ?? [],
    brandTags: data?.brandTags ?? [],
    compositions: data?.compositions,
    prescriptionReq: data?.prescriptionReq ?? false,
    isActive: data?.isActive ?? false,
    saltType: data?.saltType === 'Single Salt' ? 1 : data?.saltType == 'Multi Salt' ? 2 : 3,
    collections: (data?.collections ?? [])?.map((c) => c.name).join(', '),
    maxOrderQuantity: data?.maxOrderQuantity ?? 0
  }
}
