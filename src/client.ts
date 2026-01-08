// For more information about this file see https://dove.feathersjs.com/guides/cli/client.html
import { feathers } from '@feathersjs/feathers'
import type { TransportConnection, Application } from '@feathersjs/feathers'
import authenticationClient from '@feathersjs/authentication-client'
import type { AuthenticationClientOptions } from '@feathersjs/authentication-client'

import { appInstallReferrerTrackerClient } from './services/app-install-referrer-tracker/app-install-referrer-tracker.shared'
export type {
  AppInstallReferrerTracker,
  AppInstallReferrerTrackerData,
  AppInstallReferrerTrackerQuery,
  AppInstallReferrerTrackerPatch
} from './services/app-install-referrer-tracker/app-install-referrer-tracker.shared'

import { medicineRemainderClient } from './services/medicine-remainder/medicine-remainder.shared'
export type {
  MedicineRemainder,
  MedicineRemainderData,
  MedicineRemainderQuery,
  MedicineRemainderPatch
} from './services/medicine-remainder/medicine-remainder.shared'

import { medicineRequestsClient } from './services/medicine-requests/medicine-requests.shared'
export type {
  MedicineRequests,
  MedicineRequestsData,
  MedicineRequestsQuery,
  MedicineRequestsPatch
} from './services/medicine-requests/medicine-requests.shared'

import { analyticsTrackerHistoryClient } from './services/analytics-tracker-history/analytics-tracker-history.shared'
export type {
  AnalyticsTrackerHistory,
  AnalyticsTrackerHistoryData,
  AnalyticsTrackerHistoryQuery,
  AnalyticsTrackerHistoryPatch
} from './services/analytics-tracker-history/analytics-tracker-history.shared'

import { policiesClient } from './services/policies/policies.shared'
export type {
  Policies,
  PoliciesData,
  PoliciesQuery,
  PoliciesPatch
} from './services/policies/policies.shared'

import { referralCreditsClient } from './services/referral-credits/referral-credits.shared'
export type {
  ReferralCredits,
  ReferralCreditsData,
  ReferralCreditsQuery,
  ReferralCreditsPatch
} from './services/referral-credits/referral-credits.shared'

import { productBulkUploadClient } from './services/bulk-upload/product-bulk-upload/product-bulk-upload.shared'
export type {
  ProductBulkUpload,
  ProductBulkUploadData,
  ProductBulkUploadQuery,
  ProductBulkUploadPatch
} from './services/bulk-upload/product-bulk-upload/product-bulk-upload.shared'

import { consultancyAppointmentSlotsClient } from './services/consultancy-appointment-slots/consultancy-appointment-slots.shared'
export type {
  ConsultancyAppointmentSlots,
  ConsultancyAppointmentSlotsData,
  ConsultancyAppointmentSlotsQuery,
  ConsultancyAppointmentSlotsPatch
} from './services/consultancy-appointment-slots/consultancy-appointment-slots.shared'

import { reportsClient } from './services/reports/reports.shared'
export type { Reports, ReportsData, ReportsQuery, ReportsPatch } from './services/reports/reports.shared'

import { storePharmacistClient } from './services/store-pharmacist/store-pharmacist.shared'
export type {
  StorePharmacist,
  StorePharmacistData,
  StorePharmacistQuery,
  StorePharmacistPatch
} from './services/store-pharmacist/store-pharmacist.shared'

import { patientsClient } from './services/patients/patients.shared'
export type {
  Patients,
  PatientsData,
  PatientsQuery,
  PatientsPatch
} from './services/patients/patients.shared'

import { dashboardClient } from './services/dashboard/dashboard.shared'
export type {
  Dashboard,
  DashboardData,
  DashboardQuery,
  DashboardPatch
} from './services/dashboard/dashboard.shared'
import { davaCoinsHistoryClient } from './services/dava-coins-history/dava-coins-history.shared'
export type {
  DavaCoinsHistory,
  DavaCoinsHistoryData,
  DavaCoinsHistoryQuery,
  DavaCoinsHistoryPatch
} from './services/dava-coins-history/dava-coins-history.shared'

import { exportsClient } from './services/exports/exports.shared'
export type { Exports, ExportsData, ExportsQuery, ExportsPatch } from './services/exports/exports.shared'

import { settingsClient } from './services/settings/settings.shared'
export type {
  Settings,
  SettingsData,
  SettingsQuery,
  SettingsPatch
} from './services/settings/settings.shared'

import { bulkUploadProcessClient } from './services/bulk-upload-process/bulk-upload-process.shared'
export type {
  BulkUploadProcess,
  BulkUploadProcessData,
  BulkUploadProcessQuery,
  BulkUploadProcessPatch
} from './services/bulk-upload-process/bulk-upload-process.shared'

import { contactClient } from './services/contact/contact.shared'
export type { Contact, ContactData, ContactQuery, ContactPatch } from './services/contact/contact.shared'

import { downloadsClient } from './services/downloads/downloads.shared'
export type {
  Downloads,
  DownloadsData,
  DownloadsQuery,
  DownloadsPatch
} from './services/downloads/downloads.shared'
import { fileTransferClient } from './services/file-transfer/file-transfer.shared'
export type {
  FileTransfer,
  FileTransferData,
  FileTransferQuery,
  FileTransferPatch
} from './services/file-transfer/file-transfer.shared'
import { membershipOrdersClient } from './services/membership-orders/membership-orders.shared'
export type {
  MembershipOrders,
  MembershipOrdersData,
  MembershipOrdersQuery,
  MembershipOrdersPatch
} from './services/membership-orders/membership-orders.shared'

import { membershipsClient } from './services/memberships/memberships.shared'
export type {
  Memberships,
  MembershipsData,
  MembershipsQuery,
  MembershipsPatch
} from './services/memberships/memberships.shared'

import { logisticsClient } from './services/logistics/logistics.shared'
export type {
  Logistics,
  LogisticsData,
  LogisticsQuery,
  LogisticsPatch
} from './services/logistics/logistics.shared'

import { webhooksClient } from './services/webhooks/webhooks.shared'
export type {
  Webhooks,
  WebhooksData,
  WebhooksQuery,
  WebhooksPatch
} from './services/webhooks/webhooks.shared'

import { navigationsClient } from './services/navigations/navigations.shared'
export type {
  Navigations,
  NavigationsData,
  NavigationsQuery,
  NavigationsPatch
} from './services/navigations/navigations.shared'

import { sponsoredClient } from './services/sponsored/sponsored.shared'
export type {
  Sponsored,
  SponsoredData,
  SponsoredQuery,
  SponsoredPatch
} from './services/sponsored/sponsored.shared'

import { collectionsClient } from './services/collections/collections.shared'
export type {
  Collections,
  CollectionsData,
  CollectionsQuery,
  CollectionsPatch
} from './services/collections/collections.shared'

import { supportClient } from './services/support/support.shared'
export type { Support, SupportData, SupportQuery, SupportPatch } from './services/support/support.shared'

import { ticketsClient } from './services/tickets/tickets.shared'
export type { Tickets, TicketsData, TicketsQuery, TicketsPatch } from './services/tickets/tickets.shared'

import { consultationItemsClient } from './services/consultation-items/consultation-items.shared'
export type {
  ConsultationItems,
  ConsultationItemsData,
  ConsultationItemsQuery,
  ConsultationItemsPatch
} from './services/consultation-items/consultation-items.shared'

import { checkoutClient } from './services/checkout/checkout.shared'
export type {
  Checkout,
  CheckoutData,
  CheckoutQuery,
  CheckoutPatch
} from './services/checkout/checkout.shared'

import { prescriptionStatusClient } from './services/prescription-status/prescription-status.shared'
export type {
  PrescriptionStatus,
  PrescriptionStatusData,
  PrescriptionStatusQuery,
  PrescriptionStatusPatch
} from './services/prescription-status/prescription-status.shared'

import { consumerTicketClient } from './services/consumer-ticket/consumer-ticket.shared'
export type {
  ConsumerTicket,
  ConsumerTicketData,
  ConsumerTicketQuery,
  ConsumerTicketPatch
} from './services/consumer-ticket/consumer-ticket.shared'

import { notificationsClient } from './services/notifications/notifications.shared'
export type {
  Notifications,
  NotificationsData,
  NotificationsQuery,
  NotificationsPatch
} from './services/notifications/notifications.shared'

import { chatgptProductInfoGenerationClient } from './services/chatgpt-product-info-generation/chatgpt-product-info-generation.shared'
export type {
  ChatgptProductInfoGeneration,
  ChatgptProductInfoGenerationData,
  ChatgptProductInfoGenerationQuery,
  ChatgptProductInfoGenerationPatch
} from './services/chatgpt-product-info-generation/chatgpt-product-info-generation.shared'

import { chatgptTranslationClient } from './services/chatgpt-translation/chatgpt-translation.shared'
export type {
  ChatgptTranslation,
  ChatgptTranslationData,
  ChatgptTranslationQuery,
  ChatgptTranslationPatch
} from './services/chatgpt-translation/chatgpt-translation.shared'

import { superAdminUsersDeleteStoreClient } from './services/super-admin-users/delete-store/delete-store.shared'
export type {
  SuperAdminUsersDeleteStore,
  SuperAdminUsersDeleteStoreData,
  SuperAdminUsersDeleteStoreQuery,
  SuperAdminUsersDeleteStorePatch
} from './services/super-admin-users/delete-store/delete-store.shared'
import { generalClient } from './services/general/general.shared'
export type { General, GeneralData, GeneralQuery, GeneralPatch } from './services/general/general.shared'

import { superAdminUsersClient } from './services/super-admin-users/reset-password/reset-password.shared'
export type {
  SuperAdminUsers,
  SuperAdminUsersData,
  SuperAdminUsersQuery,
  SuperAdminUsersPatch
} from './services/super-admin-users/reset-password/reset-password.shared'

import { storeAdminUsersForgotPasswordClient } from './services/store-admin-users/forgot-password/forgot-password.shared'
export type {
  StoreAdminUsersForgotPassword,
  StoreAdminUsersForgotPasswordData,
  StoreAdminUsersForgotPasswordQuery,
  StoreAdminUsersForgotPasswordPatch
} from './services/store-admin-users/forgot-password/forgot-password.shared'

export type {
  ResendStoreInvite,
  ResendStoreInviteData,
  ResendStoreInviteQuery,
  ResendStoreInvitePatch
} from './services/resend-store-invite/resend-store-invite.shared'

import { adminZipCodesClient } from './services/admin-zip-codes/admin-zip-codes.shared'
export type {
  AdminZipCodes,
  AdminZipCodesData,
  AdminZipCodesQuery,
  AdminZipCodesPatch
} from './services/admin-zip-codes/admin-zip-codes.shared'

export type {
  RequestSuperAdminOtp,
  RequestSuperAdminOtpData,
  RequestSuperAdminOtpQuery,
  RequestSuperAdminOtpPatch
} from './services/request-super-admin-otp/request-super-admin-otp.shared'

import { appDataClient } from './services/app-data/app-data.shared'
export type { AppData, AppDataData, AppDataQuery, AppDataPatch } from './services/app-data/app-data.shared'

import { inventoryBulkUploadClient } from './services/bulk-upload/inventory-bulk-upload/inventory-bulk-upload.shared'
export type {
  InventoryBulkUpload,
  InventoryBulkUploadData,
  InventoryBulkUploadQuery,
  InventoryBulkUploadPatch
} from './services/bulk-upload/inventory-bulk-upload/inventory-bulk-upload.shared'

import { bulkUploadClient } from './services/bulk-upload/bulk-upload.shared'
export type {
  BulkUpload,
  BulkUploadData,
  BulkUploadQuery,
  BulkUploadPatch
} from './services/bulk-upload/bulk-upload.shared'

import { applicationTaxClient } from './services/application-tax/application-tax.shared'
export type {
  ApplicationTax,
  ApplicationTaxData,
  ApplicationTaxQuery,
  ApplicationTaxPatch
} from './services/application-tax/application-tax.shared'
import { inventoryStockClient } from './services/inventory-stock/inventory-stock.shared'
export type {
  InventoryStock,
  InventoryStockData,
  InventoryStockQuery,
  InventoryStockPatch
} from './services/inventory-stock/inventory-stock.shared'
import { userInvitationsClient } from './services/user-invitations/user-invitations.shared'
export type {
  UserInvitations,
  UserInvitationsData,
  UserInvitationsQuery,
  UserInvitationsPatch
} from './services/user-invitations/user-invitations.shared'

// import { salesClient } from './services/sales/sales.shared'
export type { Sales, SalesData, SalesQuery, SalesPatch } from './services/sales/sales.shared'
import { globalSearchClient } from './services/global-search/global-search.shared'
export type {
  GlobalSearch,
  GlobalSearchData,
  GlobalSearchQuery,
  GlobalSearchPatch
} from './services/global-search/global-search.shared'
import { modulesClient } from './services/modules/modules.shared'
export type { Modules, ModulesData, ModulesQuery, ModulesPatch } from './services/modules/modules.shared'

import { permissionsClient } from './services/permissions/permissions.shared'
export type {
  Permissions,
  PermissionsData,
  PermissionsQuery,
  PermissionsPatch
} from './services/permissions/permissions.shared'

import { rolesClient } from './services/roles/roles.shared'
export type { Roles, RolesData, RolesQuery, RolesPatch } from './services/roles/roles.shared'

import { orderItemTrackingClient } from './services/order-item-tracking/order-item-tracking.shared'
export type {
  OrderItemTracking,
  OrderItemTrackingData,
  OrderItemTrackingQuery,
  OrderItemTrackingPatch
} from './services/order-item-tracking/order-item-tracking.shared'

import { orderItemsClient } from './services/order-items/order-items.shared'
export type {
  OrderItems,
  OrderItemsData,
  OrderItemsQuery,
  OrderItemsPatch
} from './services/order-items/order-items.shared'

import { storeInventoryClient } from './services/store-inventory/store-inventory.shared'
export type {
  StoreInventory,
  StoreInventoryData,
  StoreInventoryQuery,
  StoreInventoryPatch
} from './services/store-inventory/store-inventory.shared'

import { deliveryPoliciesClient } from './services/delivery-policies/delivery-policies.shared'
export type {
  DeliveryPolicies,
  DeliveryPoliciesData,
  DeliveryPoliciesQuery,
  DeliveryPoliciesPatch
} from './services/delivery-policies/delivery-policies.shared'

import { zipCodesClient } from './services/zip-codes/zip-codes.shared'
export type {
  ZipCodes,
  ZipCodesData,
  ZipCodesQuery,
  ZipCodesPatch
} from './services/zip-codes/zip-codes.shared'

import { couponUsagesClient } from './services/coupon-usages/coupon-usages.shared'
export type {
  CouponUsages,
  CouponUsagesData,
  CouponUsagesQuery,
  CouponUsagesPatch
} from './services/coupon-usages/coupon-usages.shared'

import { superAdminOrdersClient } from './services/super-admin-users/orders/orders.shared'
export type {
  SuperAdminOrders,
  SuperAdminOrdersData,
  SuperAdminOrdersQuery,
  SuperAdminOrdersPatch
} from './services/super-admin-users/orders/orders.shared'

import { userAddressesClient } from './services/user-addresses/user-addresses.shared'
export type {
  UserAddresses,
  UserAddressesData,
  UserAddressesQuery,
  UserAddressesPatch
} from './services/user-addresses/user-addresses.shared'

import { cartsClient } from './services/carts/carts.shared'
export type { Carts, CartsData, CartsQuery, CartsPatch } from './services/carts/carts.shared'
import { couponsClient } from './services/coupons/coupons.shared'
export type { Coupons, CouponsData, CouponsQuery, CouponsPatch } from './services/coupons/coupons.shared'
import { paymentClient } from './services/payment/payment.shared'
export type { Payment, PaymentData, PaymentQuery, PaymentPatch } from './services/payment/payment.shared'

// import { orderClient } from './services/order/order.shared'
export type { Order, OrderData, OrderQuery, OrderPatch } from './services/order/order.shared'

import { attachmentsClient } from './services/attachments/attachments.shared'
export type {
  Attachments,
  AttachmentsData,
  AttachmentsQuery,
  AttachmentsPatch
} from './services/attachments/attachments.shared'

import { categoriesClient } from './services/categories/categories.shared'
export type {
  Categories,
  CategoriesData,
  CategoriesQuery,
  CategoriesPatch
} from './services/categories/categories.shared'

import { variationsClient } from './services/super-admin/products/variations/variations.shared'
export type {
  Variations,
  VariationsData,
  VariationsQuery,
  VariationsPatch
} from './services/super-admin/products/variations/variations.shared'

import { i18NSettingsClient } from './services/i18n-settings/i18n-settings.shared'
export type {
  I18NSettings,
  I18NSettingsData,
  I18NSettingsQuery,
  I18NSettingsPatch
} from './services/i18n-settings/i18n-settings.shared'

import { consumerProductsClient } from './services/products/products.shared'
export type {
  ConsumerProducts,
  ConsumerProductsData,
  ConsumerProductsQuery,
  ConsumerProductsPatch
} from './services/products/products.shared'

import { productsClient } from './services/super-admin/products/products.shared'
export type {
  Products,
  ProductsData,
  ProductsQuery,
  ProductsPatch
} from './services/super-admin/products/products.shared'

import { storesClient } from './services/stores/stores.shared'
export type { Stores, StoresData, StoresQuery, StoresPatch } from './services/stores/stores.shared'

import { storeAdminUsersClient } from './services/store-admin-users/store-admin-users.shared'
export type {
  StoreAdminUsers,
  StoreAdminUsersData,
  StoreAdminUsersQuery,
  StoreAdminUsersPatch
} from './services/store-admin-users/store-admin-users.shared'

import { verifyPhoneOtpClient } from './services/verify-phone-otp/verify-phone-otp.shared'
export type {
  VerifyPhoneOtp,
  VerifyPhoneOtpData,
  VerifyPhoneOtpQuery,
  VerifyPhoneOtpPatch
} from './services/verify-phone-otp/verify-phone-otp.shared'

import { userClient } from './services/users/users.shared'
export type { User, UserData, UserQuery, UserPatch } from './services/users/users.shared'

export interface Configuration {
  connection: TransportConnection<ServiceTypes>
}

export interface ServiceTypes {}

export type ClientApplication = Application<ServiceTypes, Configuration>

/**
 * Returns a typed client for the dava-india-server app.
 *
 * @param connection The REST or Socket.io Feathers client connection
 * @param authenticationOptions Additional settings for the authentication client
 * @see https://dove.feathersjs.com/api/client.html
 * @returns The Feathers client application
 */
export const createClient = <Configuration = any>(
  connection: TransportConnection<ServiceTypes>,
  authenticationOptions: Partial<AuthenticationClientOptions> = {}
) => {
  const client: ClientApplication = feathers()
  client.configure(connection)
  client.configure(authenticationClient(authenticationOptions))
  client.set('connection', connection)
  client.configure(userClient)
  client.configure(verifyPhoneOtpClient)
  client.configure(superAdminUsersClient)
  client.configure(storeAdminUsersClient)
  client.configure(storesClient)
  client.configure(productsClient)
  client.configure(categoriesClient)
  client.configure(i18NSettingsClient)
  client.configure(categoriesClient)
  client.configure(attachmentsClient)
  client.configure(cartsClient)
  client.configure(userAddressesClient)
  client.configure(variationsClient)
  client.configure(consumerProductsClient)
  client.configure(couponsClient)
  // client.configure(orderClient)
  client.configure(paymentClient)
  client.configure(superAdminOrdersClient)
  client.configure(couponUsagesClient)
  client.configure(zipCodesClient)
  client.configure(deliveryPoliciesClient)
  client.configure(categoriesClient)
  client.configure(storeInventoryClient)
  client.configure(orderItemsClient)
  client.configure(orderItemTrackingClient)
  client.configure(inventoryStockClient)
  // client.configure(salesClient)
  client.configure(globalSearchClient)
  client.configure(rolesClient)
  client.configure(permissionsClient)
  client.configure(modulesClient)
  client.configure(applicationTaxClient)
  client.configure(userInvitationsClient)
  client.configure(bulkUploadClient)
  client.configure(inventoryBulkUploadClient)
  client.configure(appDataClient)
  client.configure(adminZipCodesClient)
  client.configure(storeAdminUsersForgotPasswordClient)
  client.configure(superAdminUsersClient)
  client.configure(superAdminUsersDeleteStoreClient)
  client.configure(generalClient)
  client.configure(chatgptTranslationClient)
  client.configure(chatgptProductInfoGenerationClient)
  client.configure(sponsoredClient)
  client.configure(ticketsClient)
  client.configure(supportClient)
  client.configure(notificationsClient)
  client.configure(collectionsClient)
  client.configure(navigationsClient)
  client.configure(webhooksClient)
  client.configure(consumerTicketClient)
  client.configure(prescriptionStatusClient)
  client.configure(checkoutClient)
  client.configure(consultationItemsClient)
  client.configure(logisticsClient)
  client.configure(downloadsClient)
  client.configure(contactClient)
  client.configure(bulkUploadProcessClient)
  client.configure(settingsClient)
  client.configure(fileTransferClient)
  client.configure(exportsClient)
  client.configure(dashboardClient)
  client.configure(patientsClient)
  client.configure(membershipsClient)
  client.configure(membershipOrdersClient)
  client.configure(davaCoinsHistoryClient)
  client.configure(storePharmacistClient)
  client.configure(reportsClient)
  client.configure(consultancyAppointmentSlotsClient)
  client.configure(policiesClient)
  client.configure(productBulkUploadClient)
  client.configure(referralCreditsClient)
  client.configure(analyticsTrackerHistoryClient)
  client.configure(medicineRemainderClient)
  client.configure(medicineRequestsClient)
  client.configure(appInstallReferrerTrackerClient)
  return client
}
