import client from '.'
import { CollectionModel } from '../services/collections/collections.schema'
import { appConfig } from '../utils/config'
const productIndexName = appConfig?.elastic?.productsDb ?? 'dava-india-products'

interface SyncProduct {
  event: string | null
  data: any
}

interface ProductDoc {
  productId: string
  title: string
  description: string
  thumbnail: string
  unitPrice: number
  maximumRetailPrice: number
  discount: number
  finalPrice: number
  searchSuggestionKeywords: Array<string>
  compositions: Array<string>
}

async function syncProductWithEs({ event, data }: SyncProduct) {
  if (!data || !event) return

  const productId = data?._id.toString()
  const payload = await getEsProductDocPayload(data)

  switch (event) {
    case 'created':
      return await createEsDocument(productIndexName, productId, payload)

    case 'patched':
      return await updateEsDocument(productIndexName, productId, payload)

    case 'removed':
      return await deleteEsDocument(productIndexName, productId)

    default:
      console.log('Invalid event!')
  }
}

// Create a document
async function createEsDocument(index: string, id: string, body: ProductDoc) {
  try {
    await client.index({
      index, // The index name
      id, // Optional: Document ID (Elasticsearch will auto-generate if not provided)
      body, // The document content
      refresh: true // Refresh to make the document immediately searchable
    })
    // console.log('Document created:', response)
  } catch (e) {
    console.log(e)
  }
}

async function documentExists(index: string, id: string) {
  try {
    const exists = await client.exists({ index, id })
    // console.log('Doc exist', exists)
    return exists
  } catch (error) {
    console.error('Error checking document existence:', error)
    return false
  }
}

// Update a document
async function updateEsDocument(index: string, id: string, updatedFields: ProductDoc) {
  try {
    const exists = await documentExists(index, id)

    if (!exists) return createEsDocument(index, id, updatedFields)

    await client.update({
      index, // The index name
      id, // The ID of the document to update
      body: {
        doc: updatedFields // Fields to update
      },
      refresh: true // Refresh to make the update searchable
    })
    // console.log('Document updated:', response)
  } catch (e) {
    console.log(e)
  }
}

// Delete a document
async function deleteEsDocument(index: string, id: string) {
  try {
    const exists = await documentExists(index, id)

    if (!exists) return

    await client.delete({
      index, // The index name
      id, // The ID of the document to delete
      refresh: true // Refresh to make sure it's deleted from search results
    })
    // console.log('Document deleted:', response)
  } catch (e) {
    console.log(e)
  }
}

async function getEsProductDocPayload(data: any) {
  const collections = await CollectionModel.find({ _id: { $in: data.collections ?? [] } })
    .select('_id name')
    .lean()

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
    // compositions: (data?.compositions ?? '')?.split(' ')
    compositions: data?.compositions ?? '',
    prescriptionReq: data?.prescriptionReq ?? false,
    isActive: data?.isActive ?? false,
    minOrderQuantity: data?.minOrderQuantity ?? 0,
    maxOrderQuantity: data?.maxOrderQuantity ?? 0,
    saltType: data?.saltType === 'Single Salt' ? 1 : data?.saltType == 'Multi Salt' ? 2 : 3,
    collections: (collections ?? [])?.map((c: any) => c.name).join(', '),
    deleted: data?.deleted ?? false
  }
}

export { syncProductWithEs, createEsDocument, updateEsDocument, deleteEsDocument }
