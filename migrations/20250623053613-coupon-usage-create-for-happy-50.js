const { ObjectId } = require('mongodb')
const { emailsToMigrate } = require('../seeds/coupon-usage-emails-for-happy-50')

module.exports = {
  async up(db, client) {
    const couponId = '684d2bad2ba4b683e0adf964' // Replace with actual coupon ID

    const userCollection = db.collection('users')
    const ordersCollection = db.collection('orders')
    const couponUsagesCollection = db.collection('couponUsages')

    for (const email of emailsToMigrate) {
      const user = await userCollection.findOne({ email })

      if (!user) {
        console.warn(`User not found for email: ${email}`)
        continue
      }

      const lastOrder = await ordersCollection
        .find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(1)
        .toArray()

      if (lastOrder.length === 0) {
        console.warn(`No orders found for user: ${email}`)
        continue
      }

      const couponUsage = {
        couponId: new ObjectId(couponId),
        customerId: user._id,
        orderId: lastOrder[0]._id,
        createdAt: new Date(),
        __v: 0
      }

      await couponUsagesCollection.insertOne(couponUsage)
      console.log(`Coupon usage created for user: ${email}`)
    }
  },

  async down(db, client) {
    const userCollection = db.collection('userTable')
    const couponUsagesCollection = db.collection('couponUsages')

    for (const email of emailsToMigrate) {
      const user = await userCollection.findOne({ email })
      if (!user) continue

      await couponUsagesCollection.deleteMany({
        customerId: user._id
      })
    }
  }
}
