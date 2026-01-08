// For more information about this file see https://dove.feathersjs.com/guides/cli/service.class.html#custom-services
import type { Params } from '@feathersjs/feathers'

import type { Application } from '../../declarations'
import esClient from '../../elasticsearch'
import { appConfig } from '../../utils/config'

const productIndexName = appConfig?.elastic?.productsDb ?? 'dava-india-products'

type GlobalSearch = any
type GlobalSearchData = any
type GlobalSearchPatch = any
type GlobalSearchQuery = any

export type { GlobalSearch, GlobalSearchData, GlobalSearchPatch, GlobalSearchQuery }

export interface GlobalSearchServiceOptions {
  app: Application
}

export interface GlobalSearchParams extends Params<GlobalSearchQuery> {}

const getProductQueries = (searchText: string) => {
  return [
    {
      match: {
        title: {
          query: searchText,
          fuzziness: 'AUTO',
          prefix_length: 2,
          boost: 4
        }
      }
    },
    {
      match: {
        brandTags: {
          query: searchText,
          fuzziness: 'AUTO',
          prefix_length: 2,
          boost: 3
        }
      }
    },
    {
      match: {
        description: {
          query: searchText,
          fuzziness: 'AUTO',
          prefix_length: 2,
          boost: 1
        }
      }
    },
    {
      match: {
        searchSuggestionKeywords: {
          query: searchText,
          fuzziness: 'AUTO',
          prefix_length: 2,
          boost: 2
        }
      }
    }
  ]
}

// This is a skeleton for a custom service class. Remove or add the methods you need here
export class GlobalSearchService<ServiceParams extends GlobalSearchParams = GlobalSearchParams> {
  async find(params?: any): Promise<any> {
    // If a search query is provided
    if (params.query && !params.query.search) return []

    const { search } = params.query

    const safeString = search.replace('%%', '%25%')
    const decodedString = decodeURIComponent(safeString)

    const { products, compositions } = await handleElasticSearch(decodedString)

    return { products, compositions }
  }

  filterBasedOnScore(results: any[]) {
    // const scores = results.map((result) => result._score)
    // const minScore = Math.min(...scores)
    // const maxScore = Math.max(...scores)
    return results.reduce((acc, result) => {
      // const normalized_score = ((result._score - minScore) / (maxScore - minScore)) * 100

      // if (result._score >= 1)
      acc.push({ ...result })

      return acc
    }, [])
  }

  async create(
    data: GlobalSearchData | GlobalSearchData[],
    params?: ServiceParams
  ): Promise<GlobalSearch | GlobalSearch[]> {
    try {
      data = []

      const syncData = async (data: any) => {
        // Index product in Elasticsearch
        return await esClient.index({
          index: productIndexName,
          id: data.id.toString(), // or some unique identifier
          body: data
        })
      }

      if (Array.isArray(data)) {
        await Promise.all(data.map((current) => syncData(current)))
        await esClient.indices.refresh({ index: productIndexName })

        return []
      }

      return syncData(data)
    } catch (e) {
      console.log(e)
      throw e
    }
  }

  async remove(id: string, _params?: ServiceParams): Promise<GlobalSearch> {
    try {
      // Delete the index
      const response = await esClient.indices.delete({
        index: id
      })
      console.log('Index deleted successfully:', response)
      return {}
    } catch (error) {
      console.error('Error deleting index:', error)
      throw error
    }
  }
}

export class GlobalSearchSuggestionService<ServiceParams extends GlobalSearchParams = GlobalSearchParams> {
  async find(params?: any): Promise<any> {
    // If a search query is provided
    if (params.query && !params.query.search) return []

    const { search } = params.query
    // console.log('==> Search suggestion Text, ', search)

    // await getTokens(search)

    // Search by compositions
    const { products, compositions, suggestions } = await handleElasticSearch(search)
    return { products, compositions, suggestions }
  }
}

const handleElasticSearch = async (searchText: any) => {
  // Base filters to exclude deleted and inactive products
  const baseFilters = [
    { term: { isActive: true } },
    {
      bool: {
        should: [{ term: { deleted: false } }, { bool: { must_not: { exists: { field: 'deleted' } } } }],
        minimum_should_match: 1
      }
    }
  ]

  const result = await esClient.search({
    index: productIndexName, // Make sure to create this index
    body: {
      query: {
        bool: {
          filter: baseFilters
        }
      },
      aggs: {
        products: {
          filter: {
            bool: {
              must: [
                ...baseFilters,
                {
                  bool: {
                    should: [
                      {
                        multi_match: {
                          query: searchText,
                          fields: ['title', 'title._2gram', 'title._3gram'],
                          type: 'best_fields',
                          operator: 'and' // Ensure all terms must match
                        }
                      },
                      {
                        multi_match: {
                          query: searchText,
                          fields: [
                            'searchSuggestionKeywords',
                            'searchSuggestionKeywords._2gram',
                            'searchSuggestionKeywords._3gram'
                          ],
                          type: 'best_fields',
                          operator: 'and' // Ensure all terms must match
                        }
                      },
                      {
                        multi_match: {
                          query: searchText,
                          fields: ['brandTags', 'brandTags._2gram', 'brandTags._3gram'],
                          type: 'best_fields',
                          operator: 'and' // Ensure all terms must match
                        }
                      },
                      {
                        multi_match: {
                          query: searchText,
                          fields: ['compositions', 'compositions._2gram', 'compositions._3gram'],
                          type: 'best_fields',
                          operator: 'and' // Ensure all terms must match
                        }
                      }
                    ],
                    minimum_should_match: 1
                  }
                }
              ]
            }
          },
          aggs: {
            top_hits: {
              top_hits: {
                size: 20
              }
            }
          }
        },
        compositions: {
          filter: {
            bool: {
              must: [
                ...baseFilters,
                {
                  multi_match: {
                    query: searchText,
                    fields: ['compositions', 'compositions._2gram', 'compositions._3gram'],
                    type: 'best_fields',
                    operator: 'and' // Ensure all terms must match
                  }
                }
              ]
            }
          },
          aggs: {
            top_hits: {
              top_hits: {
                size: 20
              }
            }
          }
        },
        typeSuggestions: {
          // Only when no product avialble from product agg
          filter: {
            bool: {
              must: [
                ...baseFilters,
                {
                  bool: {
                    should: getProductQueries(searchText),
                    minimum_should_match: 1
                  }
                }
              ]
            }
          },
          aggs: {
            top_hits: {
              top_hits: {
                size: 20
              }
            }
          }
        }
      },
      // sort: [
      // {
      //   _score: {
      //     order: 'desc' // Sort by relevance score first
      //   }
      // },
      // ],
      size: 20, // Limit to 20 products per page
      from: 0 // Pagination support (this is page 1)
    }
  })

  const { typeSuggestions, products, compositions } = result?.aggregations ?? {}

  return {
    products: parseProducts(products?.top_hits),
    compositions: parseCompositions(compositions?.top_hits),
    suggestions: parseProducts(typeSuggestions?.top_hits)
  }
}

const parseProducts = (data: any): Array<any> => {
  if (!data) return []

  const { products } = data?.hits?.hits.reduce(
    (acc: any, hit: any) => {
      const prod = hit._source

      if (acc.productIds[prod.productId] || prod?.deleted) return acc

      acc.productIds[prod.productId] = true

      acc.products.push({
        id: hit._id,
        ...prod,
        _id: prod.productId,
        slugUrl: prod?.slugUrl ?? prod.title,
        description: prod?.description,
        seo: { url: prod?.slugUrl ?? prod.title },
        collections: (prod?.collections ?? '').split(',').map((p: any) => ({ name: p }))
      })

      return acc
    },
    { products: [], productIds: {} }
  )

  return sortProductsBySaltType(products)
}

const parseCompositions = (body: any): Array<any> => {
  if (!body) return []

  const filtered = body?.hits?.hits
    ?.filter((hit: any) => {
      const prod = hit._source
      return prod.saltType !== 1
    })
    .map((h: any) => h._source)

  const products = sortProductsBySaltType(filtered)

  // Map search results to your service response format
  const { compositions } = products?.reduce(
    (acc: any, prod: any) => {
      acc.compositions.push(prod?.compositions)
      return acc
    },
    { compositions: [] }
  )

  return [...new Set(compositions)]
}

function sortProductsBySaltType(products: Array<any>) {
  return products.sort((a: any, b: any) => {
    const getPriority = (saltType: number) => {
      if (saltType === 1) return 0 // Highest priority
      if (saltType === 2) return 1
      if (saltType === 3) return 2
      return 3 // Default lowest priority for missing or invalid values
    }

    return getPriority(a.saltType) - getPriority(b.saltType)
  })
}

async function getTokens(search: string) {
  try {
    const response = await esClient.indices.analyze({
      index: productIndexName, // Replace with your index name
      body: {
        analyzer: 'edge_ngram_analyzer', // Replace with your analyzer name
        text: search
      }
    })

    // console.log('Generated Tokens:')

    response.tokens.forEach((token: any) => {
      console.log(`Token: ${token.token}, Start: ${token.start_offset}, End: ${token.end_offset}`)
    })
  } catch (error) {
    console.error('Error analyzing text:', error)
  }
}

export const getOptions = (app: Application) => {
  return { app }
}
