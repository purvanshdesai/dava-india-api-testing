module.exports = {
  async up(db, client) {
    const policies = await db.collection('delivery-policies').find({}).toArray()

    for (const policy of policies) {
      const payload = {
        isStandardDeliveryAvailable: true,
        isOneDayDeliveryAvailable: false,
        deliveryModes: {
          standard: {
            timeDurationType: 'days',
            deliveryTime: policy?.expectedDeliveryTime,
            priceRange: [
              {
                priceFrom: 0,
                priceTo: policy?.freeMinOrderValue,
                noLimit: false,
                deliveryCharge: policy?.deliveryCharges
              },
              {
                priceFrom: policy?.freeMinOrderValue,
                priceTo: 0,
                noLimit: true,
                deliveryCharge: 0
              }
            ]
          },
          oneDay: {
            timeDurationType: 'days',
            deliveryTime: 0,
            priceRange: [
              {
                priceFrom: 0,
                priceTo: 0,
                noLimit: false,
                deliveryCharge: 0
              }
            ]
          }
        }
      }

      await db.collection('delivery-policies').updateOne(
        { _id: policy._id },
        {
          $unset: { freeMinOrderValue: 1, deliveryCharges: 1, expectedDeliveryTime: 1 },
          $set: payload
        }
      )
    }

    // Update deliveryMode to standard in all existing orders and orderItemTrackings
    await db.collection('orders').updateMany({}, { $set: { deliveryMode: 'standard' } })
    await db.collection('order-item-tracking').updateMany({}, { $set: { deliveryMode: 'standard' } })
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
}
