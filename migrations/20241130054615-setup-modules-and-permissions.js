const { modules } = require('../seeds/modules-and-permissions')
module.exports = {
  async up(db, client) {
    await db.collection('modules').deleteMany({})

    await db.collection('permissions').deleteMany({})

    await db.collection('roles').deleteMany({})

    const modulesToInsert = [] // To store the modules to insert

    // Loop through each module in the imported modules
    for (const moduleData of modules) {
      // Step 1: Insert Permissions for this module
      const insertedPermissions = await db.collection('permissions').insertMany(moduleData.permissions)

      const insertedPermissionIds = Object.values(insertedPermissions.insertedIds)
      // Step 2: Create a module object with permission IDs
      const module = {
        moduleName: moduleData.moduleName,
        sectionName: moduleData.sectionName,
        description: moduleData.description,
        permissions: insertedPermissionIds,
        group: moduleData.group,
        key: moduleData.key // Include the key from the module data
      }

      modulesToInsert.push(module) // Add the module to the array to insert later
    }

    // Step 3: Insert Modules
    await db.collection('modules').insertMany(modulesToInsert)

    const { insertedId } = await db.collection('roles').insertOne({
      roleName: 'Super Admin',
      fullAccess: true,
      modules: [],
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await db.collection('super-admin-users').updateMany({}, { $set: { role: insertedId } })
  },

  async down(db, client) {
    const moduleKeys = modules.map((module) => module.key) // Extract keys of the modules for deletion
    await db.collection('modules').deleteMany({ key: { $in: moduleKeys } })

    // You might want to delete permissions related to these modules as well
    const permissionKeys = modules.flatMap((module) => module.permissions.map((permission) => permission.key))
    await db.collection('permissions').deleteMany({ key: { $in: permissionKeys } })

    await db.collection('roles').deleteMany({})
  }
}
