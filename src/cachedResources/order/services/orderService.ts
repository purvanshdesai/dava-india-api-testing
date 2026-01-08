import { deliveryPolicySchema, storeSchema, policyZipArraySchema } from '../validation/orderSchema'
import {
  getDeliveryPolicyIdByStoreId,
  getDeliveryPolicyIdByZipCode,
  getDeliveryPoliciesByZipCodes
} from '../db/orderDB'
import {
  addDeliveryPolicy,
  removeDeliveryPolicy,
  getDeliveryPolicy,
  updateZipCodesForDeliveryPolicy,
  removeZipCodeFromPolicy,
  addStore,
  getStore,
  removeStore
} from '../cache/orderCache'

// Map action names to corresponding service functions
const funcMap: any = {
  addDeliveryPolicy: serviceAddDeliveryPolicy,
  removeDeliveryPolicy: serviceRemoveDeliveryPolicy,
  updateZipCodesForDeliveryPolicy: serviceUpdateZipCodesForDeliveryPolicy,
  updateZipCodesForStore: serviceUpdateZipCodesForStore,
  removeZipCodeFromPolicy: serviceRemoveZipCodeFromPolicy,
  addStore: serviceAddStore,
  removeStore: serviceRemoveStore,
  updateCoordinatesForStore: serviceUpdateCoordinatesForStore
}

/**
 * Service function to add a delivery policy to a list of zip codes.
 *
 * @param policyId - The _id of the delivery policy to add.
 * @param zipCodes - List of zip codes to associate with the policy.
 */
export async function serviceAddDeliveryPolicy(policyId: string, zipCodes: string[]): Promise<void> {
  // Validate input data before proceeding
  const { error } = deliveryPolicySchema.validate({ policyId, zipCodes })

  // If validation fails, log the error and return
  if (error) {
    console.error(
      'Validation failed for serviceAddDeliveryPolicy (deliveryPolicySchema):',
      error.details.map((detail) => detail.message).join(', ')
    )
    return
  }

  try {
    await addDeliveryPolicy(policyId, zipCodes)
  } catch (error) {
    console.error('Error in serviceAddDeliveryPolicy:', error)
  }
}

/**
 * Function to remove delivery policy from Redis.
 *
 * param policyId - The _id of the delivery policy to remove.
 */
export async function serviceRemoveDeliveryPolicy(policyId: string): Promise<void> {
  // Validate input data before proceeding
  const { error } = deliveryPolicySchema.validate({ policyId })

  // If validation fails, log the error and return
  if (error) {
    console.error(
      'Validation failed for serviceRemoveDeliveryPolicy (deliveryPolicySchema):',
      error.details.map((detail) => detail.message).join(', ')
    )
    return
  }

  try {
    // Remove the delivery policy from Redis
    await removeDeliveryPolicy(policyId)
  } catch (error) {
    console.error('Error in serviceRemoveDeliveryPolicy:', error)
  }
}

/**
 * Service function to update the zip codes associated with a delivery policy.
 *
 * @param policyId - The _id of the delivery policy to update.
 * @param zipCodes - The new list of zip codes to associate with the policy.
 *
 *
 */
export async function serviceUpdateZipCodesForDeliveryPolicy(
  policyId: string,
  zipCodes: string[]
): Promise<void> {
  // Validate input data before proceeding
  const { error } = deliveryPolicySchema.validate({ policyId, zipCodes })
  // If validation fails, log the error and return
  if (error) {
    console.error(
      'Validation failed for serviceUpdateZipCodesForDeliveryPolicy (deliveryPolicySchema):',
      error.details.map((detail) => detail.message).join(', ')
    )
    return
  }

  try {
    await updateZipCodesForDeliveryPolicy(policyId, zipCodes)
  } catch (error) {
    console.error('Error in serviceAddDeliveryPolicy:', error)
  }
}

/**
 * Service function to remove a zip code from a delivery policy.
 * @param zipCode - The zip code to remove from the policy.
 *
 * @returns void
 */
export async function serviceRemoveZipCodeFromPolicy(zipCodes: string[]): Promise<void> {
  // Validate input data before proceeding
  const { error } = deliveryPolicySchema.validate({ zipCodes })

  // If validation fails, log the error and return
  if (error) {
    console.error(
      'Validation failed for serviceRemoveZipCodeFromPolicy (deliveryPolicySchema):',
      error.details.map((detail) => detail.message).join(', ')
    )
    return
  }

  try {
    await removeZipCodeFromPolicy(zipCodes)
  } catch (error) {
    console.error('Error in serviceRemoveZipCodeFromPolicy:', error)
  }
}

/**
 * Service function to get the delivery policy ID for a given zip code.
 * It checks Redis first, and if not found, falls back to the database.
 *
 * @param zipCode - The zip code to check.
 * @returns The delivery policy _id associated with the zip code.
 */
export async function serviceGetDeliveryPolicyByZipCode(zipCode: string): Promise<string | null> {
  try {
    return await getDeliveryPolicy(zipCode)
  } catch (error) {
    console.error('Error in serviceGetDeliveryPolicyByZipCode:', error)
    return null
  }
}

/**
 * Service function to add a store's geolocation
 * @param storeId - The _id of the store to add.
 * @param lat - The latitude of the store.
 * @param lon - The longitude of the store.
 *
 * @retuns void
 */
export async function serviceAddStore(
  storeId: string,
  lat: number,
  lon: number,
  zipCodes: string[]
): Promise<void> {
  // TODO: as of now, storeId not getting into deliveryPolicies stores
  // getting only null later when this is fixed will make the changes here
  // // Fetch deliveryPolicies _id as policyId from database
  // let policyId :any = await getDeliveryPolicyIdByStoreId(storeId);

  // Fetch policyIDs By store serviceable zip
  // Get policyId and associated postalCodes from delivery
  const policies: { policyId: string; postalCodes: string[] }[] | null =
    await getDeliveryPoliciesByZipCodes(zipCodes)

  if (!policies || policies.length === 0) {
    console.warn('No policies found for the given zip codes.')
    return // Exit early if no policies exist
  }

  // Validate input data before proceeding
  const { error: storeError } = storeSchema.validate({ storeId, coordinates: { lat, lon } })
  const { error: policyZipError } = policyZipArraySchema.validate({ policies, zipCodes })

  // If validation fails, log the error and return
  if (storeError) {
    console.error(
      'Validation failed for serviceAddStore (storeSchema):',
      storeError.details.map((detail) => detail.message).join(', ')
    )
    return
  }

  // if (policyZipError) {
  //   console.error(
  //     'Validation failed for serviceAddStore (policyZipArraySchema):',
  //     policyZipError.details.map((detail) => detail.message).join(', ')
  //   )
  //   return
  // }

  try {
    // Add store to each policy
    await Promise.all(policies.map(({ policyId }) => addStore(storeId, lat, lon, policyId)))

    // Add store serviceable zip codes to Redis
    await Promise.all(policies.map(({ policyId, postalCodes }) => addDeliveryPolicy(policyId, postalCodes)))

    // console.log("Store and delivery policies updated successfully.");
  } catch (error) {
    console.error('Error in serviceAddStore:', error)
  }
}

/**
 * Service to check if a store geoinfo is available in Redis.
 * @param policyId - The _id of the delivery policy to check.
 * @param storeId - The _id of the store to check.
 *
 * @returns boolean
 */
export async function serviceGetStore(policyId: string, storeId: string): Promise<boolean> {
  try {
    return await getStore(policyId, storeId)
  } catch (error) {
    console.error('Error in serviceGetStore:', error)
    return false
  }
}

/**
 * Service Function to update ZIP_TO_POLICY_HSET_KEY for store
 */
export async function serviceUpdateZipCodesForStore(zipCodes: string[]) {
  // Get policyId and associated postalCodes from delivery for zipCodes
  const policies: { policyId: string; postalCodes: string[] }[] | null =
    await getDeliveryPoliciesByZipCodes(zipCodes)

  if (!policies || policies.length === 0) {
    console.warn('No policies found for the given zip codes.')
    return // Exit early if no policies exist
  }

  // Validate input data before proceeding
  const { error } = policyZipArraySchema.validate({ policies, zipCodes })

  // If validation fails, log the error and return
  if (error) {
    console.error(
      'Validation failed for serviceUpdateZipCodesForStore (policyZipArraySchema):',
      error.details.map((detail) => detail.message).join(', ')
    )
    return
  }

  // Fetch policyIDs By storeServiceableZip
  // If there are policies, update their zip codes in Redis concurrently
  // - `Promise.all` ensures all updates run in parallel for better performance
  // - `.map()` iterates over each policy and calls `updateZipCodesForDeliveryPolicy`
  // - `await` ensures the process completes before moving forward
  // if (policies) {
  //     await Promise.all(policies.map(({ policyId, postalCodes }) => addDeliveryPolicy(policyId, postalCodes)));
  // }
}

/**
 * Service function to update a store's geolocation
 * @param storeId - The _id of the store to add.
 * @param lat - The latitude of the store.
 * @param lon - The longitude of the store.
 *
 * @retuns void
 */
export async function serviceUpdateCoordinatesForStore(
  storeId: string,
  lat: number,
  lon: number,
  zipCodes: string[]
): Promise<void> {
  // Fetch policyIDs By store serviceable zip
  // Get policyId and associated postalCodes from delivery
  const policies: { policyId: string; postalCodes: string[] }[] | null =
    await getDeliveryPoliciesByZipCodes(zipCodes)

  if (!policies || policies.length === 0) {
    console.warn('No policies found for the given zip codes.')
    return // Exit early if no policies exist
  }

  // Validate input data before proceeding
  const { error: storeError } = storeSchema.validate({ storeId, coordinates: { lat, lon } })

  // If validation fails, log the error and return
  if (storeError) {
    console.error(
      'Validation failed for serviceAddStore (storeSchema):',
      storeError.details.map((detail) => detail.message).join(', ')
    )
    return
  }

  try {
    // Add store to each policy
    await Promise.all(policies.map(({ policyId }) => addStore(storeId, lat, lon, policyId)))

    // console.log('Store updated successfully.')
  } catch (error) {
    console.error('Error in serviceAddStore:', error)
  }
}

/**
 * Service function to remove a store's geoinfo from redis
 * @param storeId - The _id of the store to remove.
 *
 * @returns void
 */
export async function serviceRemoveStore(storeId: string, zipCodes: string[]): Promise<void> {
  // Get policyId and associated postalCodes from delivery for zipCodes
  const policies: { policyId: string; postalCodes: string[] }[] | null =
    await getDeliveryPoliciesByZipCodes(zipCodes)

  if (!policies || policies.length === 0) {
    console.warn('No policies found for the given zip codes.')
    return // Exit early if no policies exist
  }

  // Validate input data before proceeding
  const { error } = storeSchema.validate({ storeId, zipCodes })

  // If validation fails, log the error and return
  if (error) {
    console.error(
      'Validation failed for serviceRemoveStore (storeSchema):',
      error.details.map((detail) => detail.message).join(', ')
    )
    return
  }

  try {
    await Promise.all(policies.map(({ policyId }) => removeStore(storeId, policyId)))
  } catch (error) {
    console.error('Error in serviceRemoveStore:', error)
  }
}

// Function to handle the action
export async function handleAction(action: string, context: any): Promise<void> {
  const actionFunc = funcMap[action] // Get corresponding function dynamically

  if (!context.result) {
    // console.log('No valid data found in context')
    return
  }

  try {
    const { result, params } = context

    switch (action) {
      case 'addDeliveryPolicy':
        await actionFunc?.(result._id.toString(), result.postalCodes)
        break

      case 'removeDeliveryPolicy':
        await actionFunc?.(result._id.toString())
        break

      case 'removeZipCodeFromPolicy':
        await actionFunc?.(result.zipCode)
        break

      case 'addStore':
        await actionFunc?.(
          result._id.toString(),
          result.coordinates?.latitude,
          result.coordinates?.longitude,
          result.serviceableZip
        )
        break

      case 'updateStore':
        // check if store is soft deleted
        const isStoreDeleted: boolean = context.result.deleted

        if (isStoreDeleted) {
          // if true then remove store only, pass serviceableZip to get the policyId
          // in case policyId can't fetched using storeId
          await funcMap.removeStore?.(result._id.toString(), result.serviceableZip)
          break // break the switch
        }

        // Test for difference in zipCodes before and after update
        const { zipCodesToAdd } = getZipCodeDifferences(
          params.previous?.serviceableZip || [],
          result.serviceableZip || []
        )

        // Call appropriate functions if changes are detected
        if (zipCodesToAdd.length > 0) {
          await funcMap.updateZipCodesForStore?.(zipCodesToAdd)
        }

        // if storeCordinates are updated
        if (
          params.previous.coordinates.longitude !== result.coordinates.longitude ||
          params.previous.coordinates.latitude !== result.coordinates.latitude
        ) {
          await funcMap.updateCoordinatesForStore?.(
            result._id.toString(),
            result.coordinates?.latitude,
            result.coordinates?.longitude,
            result.serviceableZip
          )
        }

        // Not removing zip from redis because there can be other stores still servicing the zipCodes removed for this perticular store
        break

      case 'removeStore':
        await actionFunc?.(result._id.toString())
        break

      case 'updateDeliveryPolicy': {
        // Test for difference in zipCodes before and after update and assing to add and remove vars
        const { zipCodesToAdd, zipCodesToRemove } = getZipCodeDifferences(
          params.previous?.postalCodes || [],
          result.postalCodes || []
        )

        // Call appropriate functions if changes are detected
        if (zipCodesToAdd.length > 0) {
          await funcMap.addDeliveryPolicy?.(result._id.toString(), zipCodesToAdd)
        }

        if (zipCodesToRemove.length > 0) {
          await funcMap.removeZipCodeFromPolicy?.(zipCodesToRemove)
        }
        break
      }

      default:
        throw new Error(`Unknown action type: ${action}`)
    }
  } catch (error) {
    console.error(`Error executing ${action}:`, error)
  }
}

export function getZipCodeDifferences(
  previousZipCodes: string[] = [],
  updatedZipCodes: string[] = []
): { zipCodesToAdd: string[]; zipCodesToRemove: string[] } {
  // Convert arrays to Sets for efficient lookup
  const prevSet = new Set(previousZipCodes)
  const updatedSet = new Set(updatedZipCodes)

  // Find added and removed zip codes
  const zipCodesToAdd = updatedZipCodes.filter((zip) => !prevSet.has(zip))
  const zipCodesToRemove = previousZipCodes.filter((zip) => !updatedSet.has(zip))

  //   console.log('getZipCodeDifferences zip to be added: ', zipCodesToAdd)
  //   console.log('getZipCodeDifferences zip to remove:', zipCodesToRemove)

  return { zipCodesToAdd, zipCodesToRemove }
}
