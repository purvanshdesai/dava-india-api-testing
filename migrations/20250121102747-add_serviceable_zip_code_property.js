module.exports = {
  async up(db, client) {
    console.log('Fetching delivery policies...')

    // Step 1: Get all postal codes from the 'delivery-policies' collection
    const deliveryPolicies = await db.collection('delivery-policies').find({}).toArray()
    const serviceablePostalCodes = new Set(
      deliveryPolicies.flatMap((policy) => policy.postalCodes || []) // Flatten array and handle undefined
    )

    console.log(`Found ${serviceablePostalCodes.size} serviceable postal codes.`)

    // Step 2: Update all zip codes in one bulk operation
    const serviceableZipCodesArray = Array.from(serviceablePostalCodes)

    await db
      .collection('zip-codes')
      .updateMany({ zipCode: { $in: serviceableZipCodesArray } }, { $set: { isDeliverable: true } })

    console.log("Migration completed: 'isServiceable' field updated for all zip codes.")
  },

  async down(db, client) {
    console.log('Rolling back migration...')
    await db.collection('zip-codes').updateMany({}, { $set: { isDeliverable: false } })
    console.log("Rollback completed: 'isServiceable' field removed.")
  }
}
