module.exports = {
  async up(db, client) {
    const collection = db.collection('app-data')

    await collection.deleteMany({
      type: 'policy'
    })

    const policies = [
      { name: 'privacy_policy', url: 'policies/privacy_policy_v1.html' },
      { name: 'terms_and_conditions', url: 'policies/termcondition_v1.html' },
      { name: 'grevience_readdressal', url: 'policies/grevience_redressal_v1.html' },
      { name: 'shipping_and_delivery_policy', url: 'policies/shipping_delivery_v1.html' },
      { name: 'return_refund', url: 'policies/return_refund_v1.html' },
      { name: 'ip_policy', url: 'policies/ip_policy_v1.html' }
    ]

    const currentDate = new Date()

    const documents = policies.map((policy) => ({
      type: 'policy',
      name: policy.name,
      value: {
        url: policy.url,
        lastUpdateBy: 'User',
        lastUpdateAt: currentDate
      }
    }))

    await collection.insertMany(documents)
    console.log('Policies added to app-data collection.')
  },

  async down(db, client) {
    const collection = db.collection('app-data')
    const policyNames = [
      'privacy_policy',
      'terms_and_conditions',
      'grevience_readdressal',
      'shipping_and_delivery_policy',
      'return_refund',
      'ip_policy'
    ]

    await collection.deleteMany({
      type: 'policy',
      name: { $in: policyNames }
    })
    console.log('Policies removed from app-data collection.')
  }
}
