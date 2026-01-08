import redis from '../cache/redis'
const redisInstance = redis.getInstance()
const POLICY_STORES_PREFIX = 'policy_stores:'
/*
The function checks if any store can fulfill the entire order.
If no single store can fulfill the entire order, the function proceeds to the next steps. 
The function ensures that the order is fulfilled by the closest stores, 
either by a single store or by multiple stores if no single store can fulfill the entire order.
*/
/*
Example:
Input:
const orderItems = [
  {
    productId: '63636363636363636363636A',
    quantity: 1,
    isSelected: true
  },
  {
    productId: '63636363636363636363636B',
    quantity: 1,
    isSelected: true
  },
  {
    productId: '63636363636363636363636C',
    quantity: 1,
    isSelected: true
  }
];
const stores = [
  {
    storeId: '77777777777777777777777A',
    items: [
      '63636363636363636363636A',
      '63636363636363636363636B',
    ],
    distance: 5
  },
  {
    storeId: '77777777777777777777777B',
    items: [
      '63636363636363636363636C',
    ],
    distance: 10
  },
  {
    storeId: '77777777777777777777777C',
    items: [
      '63636363636363636363636C',
    ],
    distance: 2
  }
];
*/
/*interface OrderItem {
  productId: string
  quantity: number
  isSelected: boolean
  storeId: string
}

interface Store {
  storeId: string
  items: string[]
  distance: number
}

interface SelectedStore {
  storeId: string
  items: OrderItem[]
  distance: number
}*/

export function findNearestStores(orderItems: any[], stores: any[]): any[] {
  try {
    // 🛠️ Input validation
    if (!orderItems || orderItems.length === 0) {
      throw new Error('Order items cannot be empty.')
    }
    if (!stores || stores.length === 0) {
      throw new Error('Stores cannot be empty.')
    }

    let remainingItems = new Set(orderItems.map((item) => item.productId.toString())) // ✅ Normalize IDs
    let fullCoverageStores: any[] = []

    // 🔹 Step 1: Check if any single store has all items
    for (const store of stores) {
      // ✅ Fix: Map store.items to productId strings
      const storeItems = new Set(store.items.map((item: any) => item.productId.toString()))

      if (orderItems.every((item) => storeItems.has(item.productId.toString()))) {
        fullCoverageStores.push(store)
      }
    }

    // 🔹 Step 2: If any store can fulfill all items, return the closest one
    if (fullCoverageStores.length > 0) {
      fullCoverageStores.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
      return [
        {
          storeId: fullCoverageStores[0].storeId.toString(),
          items: orderItems,
          distance: fullCoverageStores[0].distance || Infinity,
          pincode: fullCoverageStores[0].pincode,
          coordinates: fullCoverageStores[0].coordinates
        }
      ]
    }

    // 🔹 Step 3: Group stores by storeId and merge their items
    let storeMap = new Map<
      string,
      { storeId: string; items: Set<string>; distance: number; pincode: any; coordinates: any }
    >()

    for (const store of stores) {
      const storeId = store.storeId.toString()
      if (!storeMap.has(storeId)) {
        storeMap.set(storeId, {
          storeId,
          items: new Set(),
          distance: store.distance || Infinity,
          pincode: store.pincode,
          coordinates: store.coordinates
        })
      }

      // ✅ Fix: Add productId.toString() to the item set
      store.items.forEach((item: any) => {
        storeMap.get(storeId)?.items.add(item.productId.toString())
      })
    }

    let mergedStores = Array.from(storeMap.values())

    // 🔹 Step 4: Sort stores by number of matching items (desc), then by distance (asc)
    mergedStores.sort((a, b) => {
      const aMatchCount = Array.from(a.items).filter((id) => remainingItems.has(id)).length //
      const bMatchCount = Array.from(b.items).filter((id) => remainingItems.has(id)).length //

      if (aMatchCount !== bMatchCount) return bMatchCount - aMatchCount
      return (a.distance || Infinity) - (b.distance || Infinity)
    })

    let selectedStores: any[] = []

    // 🔹 Step 5: Select stores optimally
    while (remainingItems.size > 0) {
      mergedStores.sort((a, b) => {
        const aMatchCount = Array.from(a.items).filter((id) => remainingItems.has(id)).length //
        const bMatchCount = Array.from(b.items).filter((id) => remainingItems.has(id)).length //

        if (aMatchCount !== bMatchCount) return bMatchCount - aMatchCount
        return (a.distance ?? Infinity) - (b.distance ?? Infinity)
      })

      const bestStore = mergedStores.find(
        (store) => Array.from(store.items).some((id) => remainingItems.has(id)) //
      )

      if (!bestStore) {
        break // No more matches possible
      }

      const availableItems = orderItems.filter(
        (item) =>
          bestStore.items.has(item.productId.toString()) && remainingItems.has(item.productId.toString()) //
      )

      selectedStores.push({
        storeId: bestStore.storeId,
        items: availableItems,
        distance: bestStore.distance,
        pincode: bestStore.pincode,
        coordinates: bestStore.coordinates
      })

      // ✅ Remove matched items from remaining
      availableItems.forEach((item) => remainingItems.delete(item.productId.toString()))
    }

    // ✅ New check: throw if some products couldn't be allocated
    if (remainingItems.size > 0) {
      throw new Error('One or more products are not available in any store.')
    }

    return selectedStores
  } catch (error) {
    console.error('❌ Error occurred while finding nearest stores:', error)
    return []
  }
}

export async function getStoresDistances({
  userZipCode,
  userZipLat,
  userZipLon,
  activeStores,
  policyId
}: {
  userZipCode: string
  userZipLat: number
  userZipLon: number
  activeStores: any[]
  policyId: any
}): Promise<any[]> {
  const geoKey = `${POLICY_STORES_PREFIX}${policyId}`
  const tempZipKey = `temp_zip_${userZipCode}`
  try {
    // if accurate location is not available we need to geo add else we can get from the zipcodes cache and calculate the dist
    // Add the user's ZIP code coordinates to Redis
    await redisInstance.geoadd(geoKey, userZipLon, userZipLat, tempZipKey) // Redis stores (lon, lat) format

    // Iterate through each store to calculate distance
    for (let store of activeStores) {
      const distance: any = await redisInstance.call('GEODIST', [
        geoKey,
        tempZipKey,
        store.storeId.toString(),
        'm'
      ])

      store.distance = distance ? parseFloat(distance) : Infinity // Store the distance in the store object
    }
  } catch (error) {
    console.error(`Error calculating distances: ${error}`)
  } finally {
    // Remove the temporary ZIP entry to keep Redis clean
    await redisInstance.zrem(geoKey, tempZipKey)
  }

  return activeStores
}

//Find the Items available stores
export function checkItemsAvailableStores(orderItems: any[], stores: any[]): any[] {
  const selectedProductIds = orderItems
    .filter((item) => item.isSelected)
    .map((item) => item.productId?.toString()) // Convert to string

  // Try to find a single store that has all the items
  for (const store of stores) {
    // ✅ Convert ObjectId to string
    const storeProductIds: string[] = store.items.map((id: any) => id?.toString())

    const hasAllItems = selectedProductIds.every((productId) => storeProductIds.includes(productId))

    if (hasAllItems) {
      return [store] // Return an array with just this store
    }
  }

  // If no single store has all items, find stores that have *some* of the items
  const storesWithItems = []

  for (const store of stores) {
    const storeProductIds = store.items.map((id: any) => id?.toString()) // Convert to string

    const hasAnyItems = selectedProductIds.some((productId) => storeProductIds.includes(productId))

    if (hasAnyItems) {
      storesWithItems.push(store)
    }
  }

  return storesWithItems
}
