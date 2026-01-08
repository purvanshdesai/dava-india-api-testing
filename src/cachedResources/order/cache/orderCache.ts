import Redis from '../../../cache/redis/'
import { getDeliveryPolicyIdByZipCode, getStoreById } from '../db/orderDB'
import { ZIP_TO_POLICY_HSET_KEY, POLICY_STORES_GEO_PREFIX } from './cacheKeys'

// Get the Redis instance
const redis = Redis.getInstance()

// Function to add a delivery policy with zip codes
export async function addDeliveryPolicy(policyId: string, zipCodes: any) {
  const zipEntries = zipCodes.flatMap((zip: string) => [zip, policyId]) // Flatten into key-value pairs
  await redis.hset(ZIP_TO_POLICY_HSET_KEY, ...zipEntries) // One Redis call
  // console.log(`Delivery Policy ${policyId} added for zip codes: ${zipCodes.join(', ')}`);
}

// Function to remove a delivery policy (including all its stores)
export async function removeDeliveryPolicy(policyId: string) {
  const geoKey = `${POLICY_STORES_GEO_PREFIX}${policyId}`

  // Remove all stores under this policy
  await redis.del(geoKey)

  // Remove zip codes assigned to this policy
  const zipCodes = await redis.hgetall(ZIP_TO_POLICY_HSET_KEY)

  // Filter zip codes where the policy matches the given policyId
  const zipCodesToRemove = Object.entries(zipCodes)
    .filter(([zip, policy]) => policy === policyId)
    .map(([zip, _]) => zip) // Extract zip codes to remove

  // If there are zip codes to remove, remove them in one shot
  if (zipCodesToRemove.length > 0) {
    await redis.hdel(ZIP_TO_POLICY_HSET_KEY, ...zipCodesToRemove)
    // console.log(`Removed zip codes for policyId ${policyId}: ${zipCodesToRemove.join(", ")}`);
  } else {
    // console.log(`No zip codes found for policyId: ${policyId}`);
  }
  // console.log(`Delivery Policy ${policyId} and all its stores removed.`);
}

// Function to get a delivery policy if by zip code fall back to the db if not found in Redis
export async function getDeliveryPolicy(zipCode: string) {
  let policyId: any = await redis.hget(ZIP_TO_POLICY_HSET_KEY, zipCode)
  // console.log(`Delivery Policy ${policyId} found for zip code: ${zipCode}`)
  if (policyId) {
    return policyId
  }

  try {
    policyId = await getDeliveryPolicyIdByZipCode(zipCode)
    if (policyId) {
      await redis.hset(ZIP_TO_POLICY_HSET_KEY, zipCode, policyId)
      // console.log(`Delivery Policy ${policyId} added for zip code: ${zipCode}`)
      return policyId
    } else {
      // console.log(`No delivery policy found for zip code: ${zipCode}`)
      policyId = null
    }
  } catch (error) {
    console.error('Error fetching delivery policies:', error)
    return null
  }
}

// Function to update (add/remove) a zip code to a delivery policy
// use before patch and after patch to remove or add zip code to the policy
export async function updateZipCodesForDeliveryPolicy(policyId: any, zipCodes: any) {
  try {
    // Get all zip codes assigned to this policy in Redis
    const existingZipCodes = await redis.hgetall(ZIP_TO_POLICY_HSET_KEY)

    // Remove zip codes that are assigned to this policy but no longer exist in the new zipCodes list
    for (const [zip, storedPolicyId] of Object.entries(existingZipCodes)) {
      if (storedPolicyId === policyId && !zipCodes.includes(zip)) {
        await redis.hdel(ZIP_TO_POLICY_HSET_KEY, zip)
        // console.log(`Removed zip code ${zip} from Redis for policy ${policyId}`)
      }
    }

    // Add missing zip codes to Redis that are in the new zipCodes list but not already assigned
    for (const zip of zipCodes) {
      const currentPolicyId = existingZipCodes[zip]
      if (currentPolicyId !== policyId) {
        await redis.hset(ZIP_TO_POLICY_HSET_KEY, zip, policyId)
        // console.log(`Added zip code ${zip} to Redis for policy ${policyId}`)
      }
    }
  } catch (error) {
    console.error('Error updating zip codes in Redis:', error)
  }
}

// Function to remove zip codes from a delivery policy in one Redis call
export async function removeZipCodeFromPolicy(zipCodes: string[]) {
  const removedCount = await redis.hdel(ZIP_TO_POLICY_HSET_KEY, ...zipCodes)
  // console.log(
  //   removedCount > 0
  //     ? `Removed ${removedCount} zip code(s) from their delivery policy.`
  //     : `No matching zip codes found.`
  // )
}

// Function to add a store under a specific delivery policy
export async function addStore(storeId: string, lat: number, lon: number, policyId: string) {
  const geoKey = `${POLICY_STORES_GEO_PREFIX}${policyId}`

  await redis.geoadd(geoKey, lon, lat, storeId)

  // console.log(`Store ${storeId} added under Policy ${policyId}`)
}

// getStore function to get the distance from a store to a delivery policy
export async function getStore(policyId: string, stores: any) {
  const geoKey = `${POLICY_STORES_GEO_PREFIX}${policyId}`

  try {
    for (const store of stores) {
      const storeId = store._id.toString() // Ensure _id is a string

      // Step 1: Check if store exists in Redis
      const geoInfo = await redis.geopos(geoKey, storeId)

      if (!geoInfo || geoInfo.length === 0 || geoInfo[0] == null) {
        // Step 2: If store is missing, fetch from DB
        const storeData: any = await getStoreById(storeId)

        if (storeData?.coordinates) {
          // Step 3: Add the store to Redis
          await addStore(
            storeId,
            storeData.coordinates.latitude,
            storeData.coordinates.longitude,
            policyId.toString()
          )
        } else {
          // console.log(`Store ${storeId} not found in DB`)
        }
      }
    }

    return true // Successfully processed all stores
  } catch (error) {
    console.error('Error fetching/updating store locations:', error)
    return false
  }
}

// Function to remove a store from a delivery policy
export async function removeStore(storeId: string, policyId: string) {
  const geoKey = `${POLICY_STORES_GEO_PREFIX}${policyId}`

  const removed = await redis.zrem(geoKey, storeId)

  if (removed) {
    // console.log(`Store ${storeId} removed from Policy ${policyId}`)
    return true
  } else {
    // console.log(`Store ${storeId} not found under Policy ${policyId}`)
    return
  }
}
