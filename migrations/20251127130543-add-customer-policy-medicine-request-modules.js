module.exports = {
  async up(db, client) {
    const modulesAndPermissions = [
      {
        key: 'CUSTOMER_MANAGEMENT',
        moduleName: 'Customer',
        description: 'Handles customer management',
        permissions: [
          {
            key: 'READ_CUSTOMER',
            permissionName: 'Read customer',
            description: 'Allows reading customers'
          },
          {
            key: 'CREATE_CUSTOMER',
            permissionName: 'Create customer',
            description: 'Allows creating a new customer'
          },
          {
            key: 'EDIT_CUSTOMER',
            permissionName: 'Edit customer',
            description: 'Allows editing customer information'
          },
          {
            key: 'DELETE_CUSTOMER',
            permissionName: 'Delete customer',
            description: 'Allows deleting customers'
          },
          {
            key: 'DOWNLOAD_CUSTOMER',
            permissionName: 'Download customer',
            description: 'Allows downloading customer data'
          }
        ],
        group: 'Admin'
      },
      {
        key: 'POLICY_MANAGEMENT',
        moduleName: 'Policy',
        description: 'Handles policy management',
        permissions: [
          {
            key: 'READ_POLICY',
            permissionName: 'Read policy',
            description: 'Allows reading policies'
          },
          {
            key: 'CREATE_POLICY',
            permissionName: 'Create policy',
            description: 'Allows creating a new policy'
          },
          {
            key: 'EDIT_POLICY',
            permissionName: 'Edit policy',
            description: 'Allows editing policies'
          },
          {
            key: 'DELETE_POLICY',
            permissionName: 'Delete policy',
            description: 'Allows deleting policies'
          },
          {
            key: 'DOWNLOAD_POLICY',
            permissionName: 'Download policy',
            description: 'Allows downloading policy data'
          }
        ],
        group: 'Admin'
      },
      {
        key: 'MEDICINE_REQUEST_MANAGEMENT',
        moduleName: 'Medicine Request',
        description: 'Handles medicine request management',
        permissions: [
          {
            key: 'READ_MEDICINE_REQUEST',
            permissionName: 'Read medicine request',
            description: 'Allows reading medicine requests'
          },
          {
            key: 'CREATE_MEDICINE_REQUEST',
            permissionName: 'Create medicine request',
            description: 'Allows creating a new medicine request'
          },
          {
            key: 'EDIT_MEDICINE_REQUEST',
            permissionName: 'Edit medicine request',
            description: 'Allows editing medicine requests'
          },
          {
            key: 'DELETE_MEDICINE_REQUEST',
            permissionName: 'Delete medicine request',
            description: 'Allows deleting medicine requests'
          },
          {
            key: 'DOWNLOAD_MEDICINE_REQUEST',
            permissionName: 'Download medicine request',
            description: 'Allows downloading medicine request data'
          }
        ],
        group: 'Admin'
      }
    ]

    const modulesToInsert = []

    // Loop through each module in the imported modules
    for (const moduleData of modulesAndPermissions) {
      // Check if module already exists
      const existingModule = await db.collection('modules').findOne({ key: moduleData.key })

      if (existingModule) {
        console.log(`Module ${moduleData.key} already exists, skipping...`)
        continue
      }

      // Step 1: Insert Permissions for this module
      const insertedPermissions = await db.collection('permissions').insertMany(moduleData.permissions)

      const insertedPermissionIds = Object.values(insertedPermissions.insertedIds)

      // Step 2: Create a module object with permission IDs
      const module = {
        moduleName: moduleData.moduleName,
        description: moduleData.description,
        permissions: insertedPermissionIds,
        group: moduleData.group,
        key: moduleData.key
      }

      modulesToInsert.push(module)
    }

    // Step 3: Insert Modules
    if (modulesToInsert.length > 0) {
      await db.collection('modules').insertMany(modulesToInsert)
      console.log(`Added ${modulesToInsert.length} new modules`)
    } else {
      console.log('No new modules to add')
    }
  },

  async down(db, client) {
    const moduleKeys = ['CUSTOMER_MANAGEMENT', 'POLICY_MANAGEMENT', 'MEDICINE_REQUEST_MANAGEMENT']

    // Step 1: Find and delete modules by key
    const modules = await db
      .collection('modules')
      .find({ key: { $in: moduleKeys } })
      .toArray()

    const permissionIdsToDelete = modules.flatMap((module) => module.permissions || [])

    await db.collection('modules').deleteMany({ key: { $in: moduleKeys } })

    // Step 2: Delete permissions by their IDs
    if (permissionIdsToDelete.length > 0) {
      await db.collection('permissions').deleteMany({ _id: { $in: permissionIdsToDelete } })
    }

    console.log(`Removed ${modules.length} modules and their permissions`)
  }
}
