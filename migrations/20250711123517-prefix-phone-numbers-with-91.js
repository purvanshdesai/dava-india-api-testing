module.exports = {
  async up(db, client) {
    // Find all users whose phoneNumber does NOT start with +91
    const usersToUpdate = await db
      .collection('users')
      .find({
        phoneNumber: {
          $not: { $regex: '^\\+91' },
          $ne: null
        }
      })
      .toArray()

    const bulkOps = usersToUpdate.map((user) => ({
      updateOne: {
        filter: { _id: user._id },
        update: {
          $set: {
            phoneNumber: `+91${user.phoneNumber}`
          }
        }
      }
    }))

    if (bulkOps.length > 0) {
      await db.collection('users').bulkWrite(bulkOps)
    }
  },

  async down(db, client) {
    // Rollback: Remove +91 from phoneNumbers that start with +91
    await db.collection('users').updateMany({ phoneNumber: { $regex: '^\\+91' } }, [
      {
        $set: {
          phoneNumber: {
            $substr: ['$phoneNumber', 3, { $strLenCP: '$phoneNumber' }]
          }
        }
      }
    ])
  }
}
