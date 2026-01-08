import { appInstallReferrerTracker } from './app-install-referrer-tracker/app-install-referrer-tracker'
import { medicineRemainder } from './medicine-remainder/medicine-remainder'
import { medicineRequests } from './medicine-requests/medicine-requests'
import { analyticsTrackerHistory } from './analytics-tracker-history/analytics-tracker-history'
import { policies } from './policies/policies'
import { referralCredits } from './referral-credits/referral-credits'
import { productBulkUpload } from './bulk-upload/product-bulk-upload/product-bulk-upload'
import { consultancyAppointmentSlots } from './consultancy-appointment-slots/consultancy-appointment-slots'
import { reports } from './reports/reports'
import { storePharmacist } from './store-pharmacist/store-pharmacist'
import { patients } from './patients/patients'
import { dashboard } from './dashboard/dashboard'
import { davaCoinsHistory } from './dava-coins-history/dava-coins-history'
import { exportData } from './exports/exports'
import { settings } from './settings/settings'
import { bulkUploadProcess } from './bulk-upload-process/bulk-upload-process'
import { downloads } from './downloads/downloads'
import { contact } from './contact/contact'
import { fileTransfer } from './file-transfer/file-transfer'
import { membershipOrders } from './membership-orders/membership-orders'
import { memberships } from './memberships/memberships'
import { logistics } from './logistics/logistics'
import { webhooks } from './webhooks/webhooks'
import { navigations } from './navigations/navigations'
import { sponsored } from './sponsored/sponsored'
import { collections } from './collections/collections'
import { support } from './support/support'
import { tickets } from './tickets/tickets'
import { consultationItems } from './consultation-items/consultation-items'
import { checkout } from './checkout/checkout'
import { prescriptionStatus } from './prescription-status/prescription-status'
import { consumerTicket } from './consumer-ticket/consumer-ticket'
import { consultations } from './consultations/consultations'
import { notifications } from './notifications/notifications'
import { chatgptProductInfoGeneration } from './chatgpt-product-info-generation/chatgpt-product-info-generation'
import { chatgptTranslation } from './chatgpt-translation/chatgpt-translation'
import { superAdminUsersDeleteStore } from './super-admin-users/delete-store/delete-store'
import { general } from './general/general'
import { superAdminUserForgotPassword } from './super-admin-users/forgot-password/forgot-password'
import { superAdminUsersResetPassword } from './super-admin-users/reset-password/reset-password'
import { storeAdminUsersForgotPassword } from './store-admin-users/forgot-password/forgot-password'
import { resendStoreInvite } from './resend-store-invite/resend-store-invite'
import { adminZipCodes } from './admin-zip-codes/admin-zip-codes'
import { requestSuperAdminOtp } from './request-super-admin-otp/request-super-admin-otp'
import { uploadInvoice } from './upload-invoice/upload-invoice'
import { superAdminUsersChangeStore } from './super-admin-users/change-store/change-store'
import { appData } from './app-data/app-data'
import { inventoryBulkUpload } from './bulk-upload/inventory-bulk-upload/inventory-bulk-upload'
import { bulkUpload } from './bulk-upload/bulk-upload'
import { applicationTax } from './application-tax/application-tax'
import { inventoryStock } from './inventory-stock/inventory-stock'
import { userInvitations } from './user-invitations/user-invitations'
import { sales } from './sales/sales'
import { globalSearch } from './global-search/global-search'
import { modules } from './modules/modules'
import { permissions } from './permissions/permissions'
import { roles } from './roles/roles'
import { refund } from './refund/refund'
import { storeAdminUsersPrescriptionStatus } from './store-admin-users/prescription-status/prescription-status'
import { storeAdminUsersChangeStore } from './store-admin-users/change-store/change-store'
import { storeAdminUsersResetPassword } from './store-admin-users/reset-password/reset-password'
import { storeAdminUsersOrders } from './store-admin-users/orders/orders'
import { taxes } from './taxes/taxes'
import { storeSettings } from './store-settings/store-settings'
import { storeActivity } from './store-activity/store-activity'
import { downloadStoreOrdersExcel } from './download-excel/download-store-orders-excel/download-store-orders-excel'
import { downloadExcel } from './download-excel/download-excel'
import { orderItemTracking } from './order-item-tracking/order-item-tracking'
import { orderItems } from './order-items/order-items'
import { storeInventory } from './store-inventory/store-inventory'

import { deliveryPolicies } from './delivery-policies/delivery-policies'
import { zipCodes } from './zip-codes/zip-codes'
import { couponUsages } from './coupon-usages/coupon-usages'
import { categories } from './categories/categories'
import { superAdminOrders } from './super-admin-users/orders/orders'
import { userAddresses } from './user-addresses/user-addresses'
import { carts } from './carts/carts'
import { coupons } from './coupons/coupons'
import { payment } from './payment/payment'
import { order } from './order/order'
import { attachments } from './attachments/attachments'
import { variations } from './super-admin/products/variations/variations'
import { i18NSettings } from './i18n-settings/i18n-settings'
import { consumerProducts } from './products/consumerProducts'
import { products } from './super-admin/products/products'
import { stores } from './stores/stores'
import { storeAdminUsers } from './store-admin-users/store-admin-users'
import { superAdminUsers } from './super-admin-users/super-admin-users'
import { verifyPhoneOtp } from './verify-phone-otp/verify-phone-otp'
import { user } from './users/users'
// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html#configure-functions
import type { Application } from '../declarations'

// All services will be registered here
export const services = (app: Application) => {
  app.configure(appInstallReferrerTracker)
  app.configure(medicineRemainder)
  app.configure(medicineRequests)
  app.configure(analyticsTrackerHistory)
  app.configure(policies)
  app.configure(referralCredits)
  app.configure(productBulkUpload)
  app.configure(consultancyAppointmentSlots)
  app.configure(reports)
  app.configure(storePharmacist)
  app.configure(patients)
  app.configure(dashboard)
  app.configure(davaCoinsHistory)
  app.configure(exportData)
  app.configure(settings)
  app.configure(bulkUploadProcess)
  app.configure(downloads)
  app.configure(contact)
  app.configure(fileTransfer)
  app.configure(membershipOrders)
  app.configure(memberships)
  app.configure(logistics)
  app.configure(webhooks)
  app.configure(navigations)
  app.configure(sponsored)
  app.configure(collections)
  app.configure(support)
  app.configure(tickets)
  app.configure(consultationItems)
  app.configure(checkout)
  app.configure(prescriptionStatus)
  app.configure(consumerTicket)
  app.configure(consultations)
  app.configure(notifications)
  app.configure(chatgptProductInfoGeneration)
  app.configure(chatgptTranslation)
  app.configure(superAdminUsersDeleteStore)
  app.configure(general)
  app.configure(superAdminUserForgotPassword)
  app.configure(superAdminUsersResetPassword)
  app.configure(storeAdminUsersForgotPassword)
  app.configure(resendStoreInvite)
  app.configure(adminZipCodes)
  app.configure(requestSuperAdminOtp)
  app.configure(uploadInvoice)
  app.configure(superAdminUsersChangeStore)
  app.configure(appData)
  app.configure(inventoryBulkUpload)
  app.configure(bulkUpload)
  app.configure(applicationTax)
  app.configure(inventoryStock)
  app.configure(userInvitations)
  app.configure(sales)
  app.configure(globalSearch)
  app.configure(modules)
  app.configure(permissions)
  app.configure(roles)
  app.configure(refund)
  app.configure(storeAdminUsersPrescriptionStatus)
  app.configure(storeAdminUsersChangeStore)
  app.configure(storeAdminUsersResetPassword)
  app.configure(storeAdminUsersOrders)
  app.configure(taxes)
  app.configure(storeSettings)
  app.configure(storeActivity)
  app.configure(downloadStoreOrdersExcel)
  app.configure(downloadExcel)
  app.configure(orderItemTracking)
  app.configure(orderItems)
  app.configure(storeInventory)
  app.configure(deliveryPolicies)
  app.configure(zipCodes)
  app.configure(couponUsages)
  app.configure(categories)
  app.configure(superAdminOrders)
  app.configure(userAddresses)
  app.configure(carts)
  app.configure(coupons)
  app.configure(payment)
  app.configure(order)
  app.configure(attachments)
  app.configure(consumerProducts)
  app.configure(variations)
  app.configure(i18NSettings)
  app.configure(products)
  app.configure(stores)
  app.configure(storeAdminUsers)
  app.configure(superAdminUsers)
  app.configure(verifyPhoneOtp)
  app.configure(user)
}
