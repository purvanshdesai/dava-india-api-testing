module.exports = {
  async up(db, client) {
    // Find the ORDER_MANAGEMENT module
    const orderModule = await db.collection('modules').findOne({ key: 'ORDER_MANAGEMENT' })

    if (!orderModule) {
      throw new Error('ORDER_MANAGEMENT module not found')
    }

    // Check if permission already exists
    const existingPermission = await db.collection('permissions').findOne({ key: 'CANCEL_ORDER' })

    if (existingPermission) {
      console.log('CANCEL_ORDER permission already exists')
      // Check if it's already in the module
      if (orderModule.permissions.includes(existingPermission._id)) {
        console.log('CANCEL_ORDER permission already added to ORDER_MANAGEMENT module')
        return
      }
      // Add existing permission to module
      await db
        .collection('modules')
        .updateOne({ _id: orderModule._id }, { $addToSet: { permissions: existingPermission._id } })
      return
    }

    // Insert the new permission
    const permissionResult = await db.collection('permissions').insertOne({
      key: 'CANCEL_ORDER',
      permissionName: 'Cancel order',
      description: 'Allows canceling orders (partial or whole)'
    })

    const permissionId = permissionResult.insertedId

    // Add permission to ORDER_MANAGEMENT module
    await db
      .collection('modules')
      .updateOne({ _id: orderModule._id }, { $addToSet: { permissions: permissionId } })
  },

  async down(db, client) {
    // Find the permission
    const permission = await db.collection('permissions').findOne({ key: 'CANCEL_ORDER' })

    if (!permission) {
      console.log('CANCEL_ORDER permission not found')
      return
    }

    // Remove permission from ORDER_MANAGEMENT module
    const orderModule = await db.collection('modules').findOne({ key: 'ORDER_MANAGEMENT' })
    if (orderModule) {
      await db
        .collection('modules')
        .updateOne({ _id: orderModule._id }, { $pull: { permissions: permission._id } })
    }

    // Delete the permission
    await db.collection('permissions').deleteOne({ _id: permission._id })
  }
}
