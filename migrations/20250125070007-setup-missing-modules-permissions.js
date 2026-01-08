module.exports = {
  async up(db, client) {
    const modulesAndPermissions = [
      {
        key: 'LOGISTICS_MANAGEMENT',
        moduleName: 'Logistics',
        description: 'Handles logistics',
        permissions: [
          {
            key: 'READ_LOGISTICS',
            permissionName: 'Read logistics',
            description: 'Allows reading logistics'
          },
          {
            key: 'CREATE_LOGISTICS',
            permissionName: 'Create logistics',
            description: 'Allows create logistics'
          },
          {
            key: 'EDIT_LOGISTICS',
            permissionName: 'Edit logistics',
            description: 'Allows edit logistics'
          },
          {
            key: 'DELETE_LOGISTICS',
            permissionName: 'Delete logistics',
            description: 'Allows delete logistics'
          }
        ],
        group: 'Admin'
      },
      {
        key: 'INVENTORY_MANAGEMENT',
        moduleName: 'Inventory',
        description: 'Handles inventory',
        permissions: [
          {
            key: 'VIEW_INVENTORY',
            permissionName: 'View inventory',
            description: 'Allows reading inventory'
          },
          {
            key: 'CREATE_INVENTORY',
            permissionName: 'Create inventory',
            description: 'Allows create inventory'
          }
        ],
        group: 'Admin'
      },
      {
        key: 'GENERAL_SETTING_MANAGEMENT',
        moduleName: 'General',
        description: 'Handles general settings',
        permissions: [
          {
            key: 'VIEW_GENERAL_SETTING',
            permissionName: 'View general settings',
            description: 'Allows reading genral settings'
          },
          {
            key: 'MANAGE_GENERAL_SETTING',
            permissionName: 'Manage general settings',
            description: 'Allows manage general settings'
          }
        ],
        group: 'Admin'
      }
    ]
    const modulesToInsert = []

    // Loop through each module in the imported modules
    for (const moduleData of modulesAndPermissions) {
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
  },

  async down(db, client) {
    const moduleKeys = ['LOGISTICS_MANAGEMENT', 'INVENTORY_MANAGEMENT', 'GENERAL_SETTING_MANAGEMENT']

    // Step 1: Find and delete modules by key
    const modules = await db
      .collection('modules')
      .find({ key: { $in: moduleKeys } })
      .toArray()
    const permissionIdsToDelete = modules.flatMap((module) => module.permissions)

    await db.collection('modules').deleteMany({ key: { $in: moduleKeys } })

    // Step 2: Delete permissions by their IDs
    if (permissionIdsToDelete.length > 0) {
      await db.collection('permissions').deleteMany({ _id: { $in: permissionIdsToDelete } })
    }
  }
}
