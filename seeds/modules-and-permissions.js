const modules = [
  {
    key: 'STORE_MANAGEMENT',
    moduleName: 'Store',
    description: 'Handles stores across India',
    permissions: [
      { key: 'READ_STORE', permissionName: 'Read store', description: 'Allows read stores' },
      { key: 'CREATE_STORE', permissionName: 'Create store', description: 'Allows creating a new store' },
      { key: 'EDIT_STORE', permissionName: 'Edit store', description: 'Allows edit the store' },
      { key: 'DELETE_STORE', permissionName: 'Delete store', description: 'Allows delete the store' }
    ],
    group: 'Admin'
  },
  {
    key: 'ORDER_MANAGEMENT',
    moduleName: 'Order',
    description: 'Handles orders from customers',
    permissions: [
      { key: 'READ_ORDER', permissionName: 'Read order', description: 'Allows read orders' },
      {
        key: 'CHANGE_ORDER_STORE',
        permissionName: 'Change order store',
        description: 'Allow admin to change store'
      }
    ],
    group: 'Admin'
  },
  {
    key: 'PRODUCT_MANAGEMENT',
    moduleName: 'Product',
    description: 'Handles products of DavaIndia',
    permissions: [
      { key: 'READ_PRODUCT', permissionName: 'Read product', description: 'Allows read product' },
      {
        key: 'CREATE_PRODUCT',
        permissionName: 'Create product',
        description: 'Allows creating a new product'
      },
      { key: 'EDIT_PRODUCT', permissionName: 'Edit product', description: 'Allows edit the product' },
      { key: 'DELETE_PRODUCT', permissionName: 'Delete product', description: 'Allows delete the product' }
    ],
    group: 'Admin'
  },
  {
    key: 'COLLECTION_MANAGEMENT',
    moduleName: 'Collection',
    description: 'Handles collections',
    permissions: [
      { key: 'READ_COLLECTION', permissionName: 'Read collection', description: 'Allows read collection' },
      {
        key: 'CREATE_COLLECTION',
        permissionName: 'Create collection',
        description: 'Allows create collection'
      },
      { key: 'EDIT_COLLECTION', permissionName: 'Edit collection', description: 'Allows edit collection' },
      {
        key: 'DELETE_COLLECTION',
        permissionName: 'Delete collection',
        description: 'Allows delete collection'
      }
    ],
    group: 'Admin'
  },
  {
    key: 'COUPON_MANAGEMENT',
    moduleName: 'Coupon',
    description: 'Handles coupons data',
    permissions: [
      { key: 'READ_COUPON', permissionName: 'Read coupon', description: 'Allows read coupons' },
      { key: 'CREATE_COUPON', permissionName: 'Create coupon', description: 'Allows create coupons' },
      { key: 'EDIT_COUPON', permissionName: 'Edit coupon', description: 'Allows edit coupons' },
      { key: 'DELETE_COUPON', permissionName: 'Delete coupon', description: 'Allows delete coupons' }
    ],
    group: 'Admin'
  },
  {
    key: 'LANGUAGE_TRANSLATION_MANAGEMENT',
    moduleName: 'Language Translation',
    description: 'Handles languages and translations',
    permissions: [
      { key: 'READ_LABELS', permissionName: 'Read label', description: 'Allows reading labels' },
      { key: 'EDIT_LABELS', permissionName: 'Edit label', description: 'Allows managing labels' }
    ],
    group: 'Admin'
  },
  {
    key: 'ZIP_CODE_MANAGEMENT',
    moduleName: 'ZipCode',
    description: 'Handles zipCodes',
    permissions: [
      { key: 'READ_ZIP_CODE', permissionName: 'Read zipcode', description: 'Allows reading zipCodes' },
      { key: 'CREATE_ZIP_CODE', permissionName: 'Create zipcode', description: 'Allows create zipCodes' },
      // { key: 'EDIT_ZIP_CODE', permissionName: 'Edit zipcode', description: 'Allows edit zipCodes' },
      { key: 'DELETE_ZIP_CODE', permissionName: 'Delete zipcode', description: 'Allows delete zipCodes' }
    ],
    group: 'Admin'
  },
  {
    key: 'DELIVERY_MANAGEMENT',
    moduleName: 'Delivery',
    description: 'Handles delivery policies',
    permissions: [
      {
        key: 'READ_DELIVERY_POLICY',
        permissionName: 'Read delivery policy',
        description: 'Allows reading Delivery Policy'
      },
      {
        key: 'CREATE_DELIVERY_POLICY',
        permissionName: 'Create delivery policy',
        description: 'Allows create Delivery Policy'
      },
      {
        key: 'EDIT_DELIVERY_POLICY',
        permissionName: 'Edit delivery policy',
        description: 'Allows edit Delivery Policy'
      },
      {
        key: 'DELETE_DELIVERY_POLICY',
        permissionName: 'Delete delivery policy',
        description: 'Allows delete Delivery Policy'
      }
    ],
    group: 'Admin'
  },
  {
    key: 'NAVIGATION_MANAGEMENT',
    moduleName: 'Navigation',
    description: 'Handles Navigation ',
    permissions: [
      {
        key: 'READ_NAVIGATION',
        permissionName: 'Read navigation',
        description: 'Allows reading navigation'
      },
      {
        key: 'CREATE_NAVIGATION',
        permissionName: 'Create navigation',
        description: 'Allows create navigation'
      },
      {
        key: 'EDIT_NAVIGATION',
        permissionName: 'Edit navigation',
        description: 'Allows edit navigation'
      },
      {
        key: 'DELETE_NAVIGATION',
        permissionName: 'Delete navigation',
        description: 'Allows delete navigation'
      }
    ],
    group: 'Admin'
  },
  {
    key: 'USER_MANAGEMENT',
    moduleName: 'User',
    description: 'Handles user accounts and roles',
    permissions: [
      { key: 'READ_USERS', permissionName: 'Read users', description: 'Allows reading user data' },
      {
        key: 'CREATE_USERS',
        permissionName: 'Create users',
        description: 'Allows writing user data'
      },
      {
        key: 'EDIT_USERS',
        permissionName: 'Edit users',
        description: 'Allows writing user data'
      },
      {
        key: 'DELETE_USERS',
        permissionName: 'Delete users',
        description: 'Allows deleting user data'
      }
    ],
    group: 'Admin'
  },
  {
    key: 'ROLE_MANAGEMENT',
    moduleName: 'Role',
    description: 'Handles user roles and permissions',
    permissions: [
      { key: 'READ_ROLES', permissionName: 'Read roles', description: 'Allows reading roles' },
      { key: 'CREATE_ROLES', permissionName: 'Create roles', description: 'Allows create roles' },
      { key: 'EDIT_ROLES', permissionName: 'Edit roles', description: 'Allows edit roles' },
      { key: 'DELETE_ROLES', permissionName: 'Delete roles', description: 'Allows delete roles' }
    ],
    group: 'Admin'
  },
  {
    key: 'SPONSOR_MANAGEMENT',
    moduleName: 'Sponsor',
    description: 'Handles sponsors across India',
    permissions: [
      { key: 'READ_SPONSOR', permissionName: 'Read sponsor', description: 'Allows read sponsors' },
      {
        key: 'CREATE_SPONSOR',
        permissionName: 'Create sponsor',
        description: 'Allows creating a new sponsors'
      },
      { key: 'EDIT_SPONSOR', permissionName: 'Edit sponsor', description: 'Allows edit the sponsors' },
      { key: 'DELETE_SPONSOR', permissionName: 'Delete sponsor', description: 'Allows delete the sponsors' }
    ],
    group: 'Admin'
  },
  {
    key: 'TAX_MANAGEMENT',
    moduleName: 'Tax',
    description: 'Handles delivery taxes',
    permissions: [
      {
        key: 'READ_TAX',
        permissionName: 'Read tax',
        description: 'Allows create Delivery Taxes'
      },
      {
        key: 'CREATE_TAX',
        permissionName: 'Create tax',
        description: 'Allows create Delivery Taxes'
      },
      {
        key: 'EDIT_TAX',
        permissionName: 'Edit tax',
        description: 'Allows reading Delivery Taxes'
      },
      {
        key: 'DELETE_TAX',
        permissionName: 'Delete tax',
        description: 'Allows delete Delivery Taxes'
      }
    ],
    group: 'Admin'
  },
  {
    key: 'TICKET_MANAGEMENT',
    moduleName: 'Ticket',
    sectionName: 'Prescription Inquires',
    description: 'Prescription Inquires Ticket Management',
    permissions: [
      {
        key: 'PRESCRIPTION_UPLOAD',
        permissionName: 'Prescription upload',
        description: 'Prescription upload'
      },
      {
        key: 'DOCTOR_CONSULTATION',
        permissionName: 'Doctor consultation',
        description: 'Doctor consultation'
      },
      {
        key: 'PRESCRIPTION_NOT_VERIFIED',
        permissionName: 'Prescription not verified',
        description: 'Prescription Not Verified'
      }
    ],
    group: 'Admin'
  },
  {
    key: 'TICKET_MANAGEMENT',
    moduleName: 'Ticket',
    sectionName: 'Order Inquires',
    description: 'Order Inquires Ticket Management',
    permissions: [
      {
        key: 'ORDER_NOT_DELIVERED',
        permissionName: 'Order not delivered',
        description: 'Order Not delivered'
      },
      {
        key: 'LATE_DELIVERY',
        permissionName: 'Late delivery',
        description: 'Late Delivery'
      },
      {
        key: 'WRONG_MEDICINE_DELIVERED',
        permissionName: 'Wrong medicine delivered',
        description: 'Wrong Medicine Delivered'
      },
      {
        key: 'LOST_OR_MISSING_ITEMS_IN_DELIVERY',
        permissionName: 'Lost or missing items in delivery',
        description: 'Lost or missing items in delivery'
      }
    ],
    group: 'Admin'
  }
]

module.exports = { modules }
