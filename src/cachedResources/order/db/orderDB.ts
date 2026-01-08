import { DeliveryPoliciesModel } from '../../../services/delivery-policies/delivery-policies.schema'
import { StoreModel } from '../../../services/stores/stores.schema'
import { ZipCodesModel } from '../../../services/zip-codes/zip-codes.schema'

export async function getDeliveryPolicyIdByZipCode(zipCode: string) {
  try {
    const policy = await DeliveryPoliciesModel.findOne({
      postalCodes: { $in: zipCode }
    }).lean()

    // Get _id from policies
    return policy?._id ? policy._id.toString() : null
  } catch (error) {
    console.error('Error fetching delivery policies:', error)
    return null
  }
}

/**
 * Function to get all policy
 * @param zipCodes
 * @returns
 */
export async function getDeliveryPoliciesByZipCodes(
  zipCodes: string[]
): Promise<{ policyId: string; postalCodes: string[] }[] | null> {
  try {
    const policies = await DeliveryPoliciesModel.find({
      postalCodes: { $in: zipCodes }
    })
      .select('_id postalCodes')
      .lean()

    // Transform results to return policyId (string) and postalCodes (array)
    return policies.map((policy) => ({
      policyId: policy._id.toString(),
      postalCodes: policy.postalCodes || [] // Ensure postalCodes is always an array
    }))
  } catch (error) {
    console.error('Error fetching delivery policies:', error)
    return null
  }
}

export async function getDeliveryPolicyIdByStoreId(storeId: string) {
  try {
    const policy = await DeliveryPoliciesModel.findOne({
      stores: { $in: [storeId] }
    }).lean()
    return policy?._id
  } catch (error) {
    console.error('Error fetching delivery policies:', error)
    return null
  }
}

// Function to get a store by ID
// @param storeId: string - The ObjectId of the store
export async function getStoreById(storeId: string) {
  try {
    // Step 1: Fetch store from DB
    let store: any = await StoreModel.findOne({ _id: storeId }).lean()

    if (!store) {
      // console.log(`Store ${storeId} not found in DB.`)
      return null
    }

    // Step 2: If store has coordinates, return it
    if (store.coordinates?.latitude && store.coordinates?.longitude) {
      return store
    }

    // Step 3: If store is missing coordinates, find from ZipCodeModel
    const zipCodeData: any = await ZipCodesModel.findOne({ zipCode: store.pincode }).lean()

    // Step 4: Extract coordinates and update store object
    const [longitude, latitude] = zipCodeData.location.coordinates // GeoJSON format [lng, lat]

    return {
      ...store,
      coordinates: { latitude, longitude } // Update with correct format
    }
  } catch (error) {
    console.error('Error fetching store:', error)
    return null
  }
}
