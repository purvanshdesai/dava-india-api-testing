import client from '.'
import { appConfig } from '../utils/config'
const productIndexName = appConfig?.elastic?.productsDb ?? 'dava-india-products'

const createProductIndex = async () => {
  const exists: any = await client.indices.exists({ index: productIndexName })
  console.log('==> Elasticsearch, Product Index exists', exists)

  if (!exists) {
    const res = await client.indices.create({
      index: productIndexName,
      body: {
        // settings: {
        //   analysis: {
        //     tokenizer: {
        //       edge_ngram_tokenizer: {
        //         type: 'edge_ngram',
        //         min_gram: 2,
        //         max_gram: 20,
        //         token_chars: ['letter', 'digit', 'whitespace']
        //       }
        //     },
        //     analyzer: {
        //       edge_ngram_analyzer: {
        //         tokenizer: 'edge_ngram_tokenizer',
        //         filter: ['lowercase']
        //       }
        //     }
        //   }
        // },
        // mappings: {
        //   properties: {
        //     productId: { type: 'text' },
        //     title: {
        //       type: 'text',
        //       //  analyzer: 'edge_ngram_analyzer', search_analyzer: 'standard'
        //       fields: {
        //         ngram: {
        //           type: 'text',
        //           analyzer: 'edge_ngram_analyzer'
        //         },
        //         standard: {
        //           type: 'text',
        //           analyzer: 'standard'
        //         }
        //       }
        //     },
        //     description: { type: 'text', analyzer: 'standard' },
        //     thumbnail: { type: 'text' },
        //     slugUrl: { type: 'text' },
        //     unitPrice: { type: 'float' },
        //     maximumRetailPrice: { type: 'float' },
        //     discount: { type: 'float' },
        //     finalPrice: { type: 'float' },
        //     searchSuggestionKeywords: {
        //       type: 'text',
        //       analyzer: 'edge_ngram_analyzer',
        //       search_analyzer: 'standard'
        //     },
        //     brandTags: {
        //       type: 'text',
        //       analyzer: 'edge_ngram_analyzer',
        //       search_analyzer: 'standard'
        //     },
        //     compositions: { type: 'text', analyzer: 'edge_ngram_analyzer', search_analyzer: 'standard' },
        //     prescriptionReq: { type: 'boolean' },
        //     isActive: { type: 'boolean' }
        //   }
        // }
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
            collections: { type: 'text' },
            deleted: { type: 'boolean' }
          }
        }
      }
    })

    console.log(res)
  }
}

const createSearchHistoryIndex = async () => {
  const exists: any = await client.indices.exists({ index: 'search-suggestion-history' })
  console.log('==> Elasticsearch, Search Suggestion History Index exists', exists)

  if (!exists) {
    const res = await client.indices.create({
      index: 'search-suggestion-history',
      body: {
        mappings: {
          properties: {
            keyword: { type: 'text' },
            clickedOn: { type: 'date' },
            referenceType: { type: 'text' },
            productId: { type: 'text' }
          }
        }
      }
    })

    console.log(res)
  }
}

export async function setupElasticsearch() {
  await Promise.all([createProductIndex(), createSearchHistoryIndex()])
}
