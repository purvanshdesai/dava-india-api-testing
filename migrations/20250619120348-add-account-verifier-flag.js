module.exports = {
  async up(db, client) {
    await db.collection('users').updateMany({ isPhoneNumberVerified: { $exists: true } }, [
      {
        $set: {
          accountVerified: '$isPhoneNumberVerified'
        }
      },
      {
        $unset: 'isPhoneNumberVerified'
      }
    ])
  },

  async down(db, client) {
    await db.collection('users').updateMany({ accountVerified: { $exists: true } }, [
      {
        $set: {
          isPhoneNumberVerified: '$accountVerified'
        }
      },
      {
        $unset: 'accountVerified'
      }
    ])
  }
}
