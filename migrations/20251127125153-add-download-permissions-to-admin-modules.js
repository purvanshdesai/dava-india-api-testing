module.exports = {
  async up(db, client) {
    // Get all existing modules
    const modules = await db.collection('modules').find({}).toArray()

    const modulesToUpdate = []

    // Helper function to generate download permission key
    const getDownloadPermissionKey = (moduleKey) => {
      // Remove _MANAGEMENT suffix if present, otherwise use the key as-is
      const baseKey = moduleKey.replace(/_MANAGEMENT$/, '')
      return `DOWNLOAD_${baseKey}`
    }

    // Loop through each module
    for (const module of modules) {
      // Skip if module doesn't have a key
      if (!module.key) {
        continue
      }

      // Generate download permission key
      const downloadPermissionKey = getDownloadPermissionKey(module.key)

      // Check if permission already exists
      const existingPermission = await db.collection('permissions').findOne({ key: downloadPermissionKey })

      if (existingPermission) {
        // Permission exists, check if it's already in the module
        const permissionIdStr = existingPermission._id.toString()
        const modulePermissionIds = (module.permissions || []).map((id) =>
          id.toString ? id.toString() : String(id)
        )

        if (!modulePermissionIds.includes(permissionIdStr)) {
          // Add permission to module if not already present
          modulesToUpdate.push({
            moduleId: module._id,
            permissionId: existingPermission._id
          })
        }
      } else {
        // Create new DOWNLOAD permission
        const permissionName = `Download ${module.moduleName || module.key}`
        const description = `Allows downloading ${(module.moduleName || module.key).toLowerCase()} data`

        const { insertedId } = await db.collection('permissions').insertOne({
          key: downloadPermissionKey,
          permissionName: permissionName,
          description: description
        })

        // Add permission to module
        modulesToUpdate.push({
          moduleId: module._id,
          permissionId: insertedId
        })
      }
    }

    // Update modules with new permissions
    for (const update of modulesToUpdate) {
      await db
        .collection('modules')
        .updateOne({ _id: update.moduleId }, { $push: { permissions: update.permissionId } })
    }

    console.log(`Added DOWNLOAD permissions to ${modulesToUpdate.length} modules`)
  },

  async down(db, client) {
    // Get all modules
    const modules = await db.collection('modules').find({}).toArray()

    const permissionIdsToRemove = []

    // Helper function to generate download permission key
    const getDownloadPermissionKey = (moduleKey) => {
      // Remove _MANAGEMENT suffix if present, otherwise use the key as-is
      const baseKey = moduleKey.replace(/_MANAGEMENT$/, '')
      return `DOWNLOAD_${baseKey}`
    }

    // Find all DOWNLOAD permissions
    for (const module of modules) {
      // Skip if module doesn't have a key
      if (!module.key) {
        continue
      }

      const downloadPermissionKey = getDownloadPermissionKey(module.key)

      const permission = await db.collection('permissions').findOne({ key: downloadPermissionKey })

      if (permission) {
        permissionIdsToRemove.push(permission._id)

        // Remove permission from module
        await db
          .collection('modules')
          .updateOne({ _id: module._id }, { $pull: { permissions: permission._id } })
      }
    }

    // Delete DOWNLOAD permissions
    if (permissionIdsToRemove.length > 0) {
      await db.collection('permissions').deleteMany({
        _id: { $in: permissionIdsToRemove }
      })
    }

    console.log(`Removed DOWNLOAD permissions from ${permissionIdsToRemove.length} modules`)
  }
}
