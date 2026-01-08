const molecules = ['Alprazolam', 'Altretamine', 'Amiodarone', 'Amitriptyline', 'Beta blocker'].map((n) => ({
  type: 'molecule',
  name: n
}))

const ADMIN = 'admin'
const CONSUMER = 'consumer'
const trackOrderStatuses = [
  {
    type: 'order-tracking-status',
    name: 'Order placed',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'order_placed'
  },
  {
    type: 'order-tracking-status',
    name: 'Order confirmed',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'order_confirmed'
  },
  {
    type: 'order-tracking-status',
    name: 'Order under verification',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'order_under_verification'
  },
  {
    type: 'order-tracking-status',
    name: 'Dispatched',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'dispatched'
  },
  {
    type: 'order-tracking-status',
    name: 'Delivered',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'delivered'
  },
  {
    type: 'order-tracking-status',
    name: 'Return to origin(RTO) request',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'return_to_origin'
  },
  {
    type: 'order-tracking-status',
    name: 'Return approved',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'return_approved'
  },
  {
    type: 'order-tracking-status',
    name: 'Return declined',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'return_declined'
  },
  {
    type: 'order-tracking-status',
    name: 'Refund Initiated',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'refund_initiated'
  },
  {
    type: 'order-tracking-status',
    name: 'Refund completed',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'refund_completed'
  },

  {
    type: 'order-tracking-status',
    name: 'Customer requested to cancel',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'customer_canceled'
  },
  {
    type: 'order-tracking-status',
    name: 'Order canceled',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'canceled'
  },
  {
    type: 'order-tracking-status',
    name: 'Canceled by Shop',
    visibility: [ADMIN],
    statusCode: 'canceled_by_shop'
  },
  {
    type: 'order-tracking-status',
    name: 'Order transferred to another shop',
    visibility: [ADMIN],
    statusCode: 'order_transferred_to_another_shop'
  },
  {
    type: 'order-tracking-status',
    name: 'Prescription is approved',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'prescription_approved'
  },
  {
    type: 'order-tracking-status',
    name: 'Prescription is not valid',
    visibility: [ADMIN],
    statusCode: 'prescription_declined'
  },
  {
    type: 'order-tracking-status',
    name: 'Prescription is not clear',
    visibility: [ADMIN],
    statusCode: 'prescription_not_clear'
  },
  {
    type: 'order-tracking-status',
    name: 'Prescription is not available',
    visibility: [ADMIN],
    statusCode: 'prescription_not_available'
  },
  {
    type: 'order-tracking-status',
    name: 'Admin Attention Required',
    visibility: [ADMIN],
    statusCode: 'admin_attention_required'
  },
  {
    type: 'order-tracking-status',
    name: 'Informational Update',
    visibility: [ADMIN],
    statusCode: 'informational_update'
  },
  {
    type: 'order-tracking-status',
    name: 'Customer raised a concern to change the address',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'customer_raised_a_concern'
  },
  {
    type: 'order-tracking-status',
    name: 'Prescription is being generated',
    visibility: [ADMIN],
    statusCode: 'prescription_being_generated'
  },
  {
    type: 'order-tracking-status',
    name: 'Prescription generated',
    visibility: [ADMIN],
    statusCode: 'prescription_generated'
  },
  {
    type: 'order-tracking-status',
    name: 'Shipped',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'shipped'
  },
  {
    type: 'order-tracking-status',
    name: 'Cancelled',
    visibility: [ADMIN],
    statusCode: 'logistics_cancelled'
  },
  {
    type: 'order-tracking-status',
    name: 'RTO delivered',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'rto_delivered'
  },
  {
    type: 'order-tracking-status',
    name: 'Pickup rescheduled',
    visibility: [ADMIN],
    statusCode: 'pickup_rescheduled'
  },
  {
    type: 'order-tracking-status',
    name: 'Out for delivery',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'out_for_delivery'
  },
  {
    type: 'order-tracking-status',
    name: 'In transit',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'in_transit'
  },
  {
    type: 'order-tracking-status',
    name: 'Out for pickup',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'out_for_pickup'
  },
  {
    type: 'order-tracking-status',
    name: 'Undelivered',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'undelivered'
  },
  {
    type: 'order-tracking-status',
    name: 'Delayed',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'delayed'
  },
  {
    type: 'order-tracking-status',
    name: 'Fulfilled',
    visibility: [ADMIN],
    statusCode: 'fulfilled'
  },
  {
    type: 'order-tracking-status',
    name: 'Picked up',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'picked_up'
  },
  {
    type: 'order-tracking-status',
    name: 'Cancelled before dispatch',
    visibility: [ADMIN],
    statusCode: 'cancelled_before_dispatch'
  },
  {
    type: 'order-tracking-status',
    name: 'RTO in transit',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'rto_in_transit'
  },
  {
    type: 'order-tracking-status',
    name: 'QC Failed',
    visibility: [ADMIN],
    statusCode: 'qc_failed'
  },
  {
    type: 'order-tracking-status',
    name: 'Handover to courier',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'handover_to_courier'
  },
  {
    type: 'order-tracking-status',
    name: 'Shipment booked',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'shipment_booked'
  },
  {
    type: 'order-tracking-status',
    name: 'Delivery Pending',
    visibility: [ADMIN, CONSUMER],
    statusCode: 'delivery_pending'
  },
  {
    type: 'order-tracking-status',
    name: 'Manifested',
    visibility: [ADMIN],
    statusCode: 'manifested'
  },
  {
    type: 'order-tracking-status',
    name: 'Skip Logistics',
    visibility: [ADMIN],
    statusCode: 'skip_logistic'
  },
  {
    type: 'order-tracking-status',
    name: 'Unskip Logistics',
    visibility: [ADMIN],
    statusCode: 'unskip_logistic'
  }
]

const storeTransferReasons = [
  { type: 'store-transfer-reason', statusCode: 'stockUnavailability', name: 'Stock Unavailability' },
  { type: 'store-transfer-reason', statusCode: 'locationProximity', name: 'Location Proximity' },
  { type: 'store-transfer-reason', statusCode: 'operationalDelay', name: 'Operational Delay' },
  { type: 'store-transfer-reason', statusCode: 'technicalIssue', name: 'Technical Issue' },
  { type: 'store-transfer-reason', statusCode: 'other', name: 'Other' }
]

const itemReturnReasons = [
  { type: 'item-return-reason', statusCode: 'damaged-product', name: 'In transit damaged' },
  // { type: 'item-return-reason', statusCode: 'missing-item', name: 'Missing item' },
  {
    type: 'item-return-reason',
    statusCode: 'wrong-item',
    name: 'Receive items different from the order placed'
  },
  // { type: 'item-return-reason', statusCode: 'not-as-described', name: 'Product not as described' },
  { type: 'item-return-reason', statusCode: 'expired', name: 'Received nearby or expired product' }
  // { type: 'item-return-reason', statusCode: 'order-not-received', name: 'Order not received' },
  // { type: 'item-return-reason', statusCode: 'return-refund-issue', name: 'Return/Refund issue' },
  // { type: 'item-return-reason', statusCode: 'other', name: 'Other' }
]

const itemCancelReasons = [
  { type: 'item-cancel-reason', statusCode: 'ordered-by-mistake', name: 'Ordered by mistake' },
  { type: 'item-cancel-reason', statusCode: 'selected-wrong-medicine', name: 'Selected the wrong medicine' },
  { type: 'item-cancel-reason', statusCode: 'found-cheaper-elsewhere', name: 'Found a cheaper option elsewhere' },
  { type: 'item-cancel-reason', statusCode: 'prescription-changed', name: 'Prescription changed by the doctor' },
  { type: 'item-cancel-reason', statusCode: 'not-required-anymore', name: 'No longer required the medicine' },
  { type: 'item-cancel-reason', statusCode: 'delivery-too-long', name: 'Delivery time is too long' },
  { type: 'item-cancel-reason', statusCode: 'address-incorrect-update', name: 'Delivery address is incorrect or needs to be updated' },
  { type: 'item-cancel-reason', statusCode: 'payment-issues', name: 'Payment issues (failed/duplicate payment)' },
  { type: 'item-cancel-reason', statusCode: 'out-of-stock', name: 'Stock not available / Out of stock' },
  { type: 'item-cancel-reason', statusCode: 'dosage-incorrect', name: 'Dosage was incorrect' },
  { type: 'item-cancel-reason', statusCode: 'modify-quantity', name: 'Wanted to modify the quantity' },
  { type: 'item-cancel-reason', statusCode: 'switched-medicine-alternative-brand', name: 'Switched to a different medicine/alternative brand' },
  { type: 'item-cancel-reason', statusCode: 'duplicate-order', name: 'Duplicate order placed accidentally' },
  { type: 'item-cancel-reason', statusCode: 'patient-condition-change', name: 'Change in patient condition' },
  { type: 'item-cancel-reason', statusCode: 'allergic-reaction-concern', name: 'Allergic reaction concern after checking ingredients' },
  { type: 'item-cancel-reason', statusCode: 'pharmacist-advised-cancellation', name: 'Pharmacist advised cancellation' },
  { type: 'item-cancel-reason', statusCode: 'courier-issues', name: 'Courier/delivery partner issues' },
  { type: 'item-cancel-reason', statusCode: 'order-delayed', name: 'Order delayed beyond expected time' },
  { type: 'item-cancel-reason', statusCode: 'incorrect-product-summary', name: 'Incorrect product shown in the order summary' },
  { type: 'item-cancel-reason', statusCode: 'personal-reason', name: 'Personal reason' }
]

const languages = [
  {
    type: 'language',
    name: 'Hindi',
    code: 'hi',
    symbol: 'हिं'
  },
  {
    type: 'language',
    name: 'Tamil',
    code: 'ta',
    symbol: 'த'
  },
  {
    type: 'language',
    name: 'Telugu',
    code: 'te',
    symbol: 'తె'
  },
  {
    type: 'language',
    name: 'Bengali',
    code: 'bn',
    symbol: 'বা'
  },
  {
    type: 'language',
    name: 'Marathi',
    code: 'mr',
    symbol: 'म'
  },
  {
    type: 'language',
    name: 'Gujarati',
    code: 'gu',
    symbol: 'ગુ'
  },
  {
    type: 'language',
    name: 'Punjabi',
    code: 'pa',
    symbol: 'ਪੰ'
  },
  {
    type: 'language',
    name: 'Kannada',
    code: 'kn',
    symbol: 'ಕ'
  },
  {
    type: 'language',
    name: 'Malayalam',
    code: 'ml',
    symbol: 'മ'
  },
  {
    type: 'language',
    name: 'Odia',
    code: 'or',
    symbol: 'ଓଡ଼'
  }
]
const consumptions = [
  {
    type: 'consumption',
    value: 'oral',
    label: 'Oral'
  },
  {
    type: 'consumption',
    value: 'sublingual',
    label: 'Sublingual'
  },
  {
    type: 'consumption',
    value: 'rectral',
    label: 'Rectral'
  },
  {
    type: 'consumption',
    value: 'intradermal',
    label: 'Intradermal (ID)'
  },
  {
    type: 'consumption',
    value: 'subcutaneous',
    label: 'Subcutaneous (SQ)'
  },
  {
    type: 'consumption',
    value: 'intramuscualr',
    label: 'Intramuscular (IM)'
  },
  {
    type: 'consumption',
    value: 'intravenous',
    label: 'Intravenous (IV)'
  },
  {
    type: 'consumption',
    value: 'intrathecal',
    label: 'Intrathecal '
  },
  {
    type: 'consumption',
    value: 'intraosseous',
    label: 'Intraosseous '
  },
  {
    type: 'consumption',
    value: 'epidural',
    label: 'Epidural '
  },
  {
    type: 'consumption',
    value: 'intracardiac',
    label: 'Intacardiac '
  },
  {
    type: 'consumption',
    value: 'intraarterial',
    label: 'Intraarterial '
  },
  {
    type: 'consumption',
    value: 'intraarticular',
    label: 'Intraarticular '
  },
  {
    type: 'consumption',
    value: 'intraperitoneal',
    label: 'Intraperitoneal '
  },
  {
    type: 'consumption',
    value: 'topical',
    label: 'Topical '
  },
  {
    type: 'consumption',
    value: 'inhalation',
    label: 'Inhalation '
  },
  {
    type: 'consumption',
    value: 'adhesiveUnit',
    label: 'Adhesive Unit'
  },
  {
    type: 'consumption',
    value: 'inunction',
    label: 'Inunction'
  },
  {
    type: 'consumption',
    value: 'iontophoresis',
    label: 'Iontophoresis'
  },
  {
    type: 'consumption',
    value: 'jetInjection',
    label: 'Jet Injection'
  }
]

module.exports = {
  molecules,
  languages,
  trackOrderStatuses,
  storeTransferReasons,
  itemReturnReasons,
  itemCancelReasons,
  consumptions
}
