import { feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'
import { Types } from 'mongoose'

const app = feathers().configure(configuration())
import { Shiprocket } from './Shiprocket'
import { OrderModel } from '../../services/order/order.schema'
import { OrderItemTrackingModal } from '../../services/order-item-tracking/order-item-tracking.schema'
import { DeliveryPoliciesModel } from '../../services/delivery-policies/delivery-policies.schema'
import { LogisticsRulesModel } from '../../services/logistics/logistics.schema'
import { StoreModel } from '../../services/stores/stores.schema'
import moment from 'moment-timezone'
import Logistics, { AVAILABLE_LOGISTICS } from './Logistics'
import { generateRandomNumber } from '../index'
import { downloadAndUploadLabelToS3 } from '../utilities'
import { ReturnOrderItem, ReturnOrderParams } from './types'
import { STANDARD_DELIVERY_LOGISTICS, DELIVERY_MODES } from './Logistics'
import { ShiprocketQuick } from './ShiprocketQuick'
import { UsersModel } from '../../services/users/users.schema'
import { DelhiveryClient } from './Delhivery/delhivery'

export interface OrderCreateParams {
  order: any
  orderTracking: any
  store: any
  couriers: any
}

export const createLogisticsOrder = async (orderTrackingId: string | Types.ObjectId) => {
  try {
    const orderTracking: any = await OrderItemTrackingModal.findById(orderTrackingId)
      .populate({ path: 'items', populate: { path: 'product' } })
      .lean()

    if (!orderTracking) throw new Error('Order tracking not found')

    const store = await StoreModel.findById(orderTracking.store).lean()
    if (!store) throw new Error('Store not found')

    const deliveryPolicy = await DeliveryPoliciesModel.findOne({ stores: orderTracking.store }).lean()
    if (!deliveryPolicy) throw new Error('Delivery policy not found')

    const logisticsRule = await LogisticsRulesModel.findOne({ deliveryZones: deliveryPolicy._id }).lean()
    if (!logisticsRule) throw new Error('Logistics rule not found for this delivery policy')

    const deliveryMode = orderTracking?.deliveryMode ?? DELIVERY_MODES.STANDARD

    const couriers = (logisticsRule.couriers ?? []).filter((courier) => courier.deliveryMode === deliveryMode)

    if (!couriers?.length) throw new Error('No couriers are added in this rule')

    const order: any = await OrderModel.findById(orderTracking.order).lean()
    if (!order) throw new Error('Order not found')

    if (deliveryMode === DELIVERY_MODES.STANDARD) {
      await handleCreateDelhiveryOrder({ order, orderTracking, store, couriers })
      // else {
      //   // TODO: Handle multiple standard delivery modes
      //   const partner = STANDARD_DELIVERY_LOGISTICS[0]
      //   if (partner === 'shiprocket')
      //     await handleCreateShiprocketOrder({ order, orderTracking, store, couriers })
      // }
    } else if (deliveryMode === DELIVERY_MODES.ONE_DAY) {
      await handleCreateShiprocketQuickOrder({ order, orderTracking, store, couriers })
    }
  } catch (err) {
    // console.log('Could not create logistics order', err, orderTrackingId?.toString())

    throw err
  }
}

const handleCreateShiprocketOrder = async (params: OrderCreateParams) => {
  let logisticsData: any = {}

  try {
    const { order, orderTracking, store, couriers } = params

    const {
      address: { userName, phoneNumber, addressLine1, addressLine2, postalCode, city, state, country }
    } = order

    const courierServiceabilityPayload = {
      parcel: {
        volume: {
          height: orderTracking?.volume?.length as number,
          width: orderTracking?.volume?.width as number,
          breadth: orderTracking?.volume?.breadth as number
        },
        weight: orderTracking?.weight as number,
        sourcePostalCode: store.pincode,
        destinationPostalCode: postalCode
      }
    }

    // STEP 1: Checking courier serviceability
    // Fetch servicable information
    const serviceableCouriers =
      (await Logistics.getAggregator('shiprocket').courierServiceability({
        ...courierServiceabilityPayload
      })) || []

    // console.log('Step 1 ===> checking courierServiceability', serviceableCouriers?.length)

    const packageSize = orderTracking.packageSize ?? 'small'

    const whitelistedCourierIds = couriers
      .filter((c: any) => c.packageSize?.includes(packageSize))
      .map((c: any) => c.partnerCourierId)

    const serviceableWhitelistedCouriers = serviceableCouriers.filter((c: any) =>
      whitelistedCourierIds.includes(c.id)
    )

    // console.log('serviceableWhitelistedCouriers ==>', serviceableWhitelistedCouriers)

    if (serviceableWhitelistedCouriers?.length === 0) throw new Error('No courier service available')

    // Sort by charge and pick less charge courier
    // const selectedCourier = serviceableWhitelistedCouriers.sort((a, b) => a.charges - b.charges)[0]
    const selectedCourier =
      serviceableWhitelistedCouriers[Math.floor(Math.random() * serviceableWhitelistedCouriers.length)]

    // console.log('selectedCourier ==>', selectedCourier)

    if (!selectedCourier) throw new Error('No courier service available')

    const subTotal = await orderTracking.items.reduce((acc: number, curr: any) => {
      acc += curr.quantity * curr.amount
      return acc
    }, 0)

    // STEP 2: Create pickup location and store that pickup location id
    let pickupLocation =
      store?.logistics?.shiprocket?.pickupLocation || store?.logistics?.shiprocketQuick?.pickupLocation

    if (!pickupLocation) {
      try {
        const resp = await (Logistics.getAggregator('shiprocket') as Shiprocket).addStorePickupLocation({
          locationName: store._id.toString(),
          name: store.storeName,
          email: store.email,
          phone: store.phoneNumber || '',
          address: (store.address || '').replace(/\s+/g, ' ').trim().slice(0, 190),
          city: store.city,
          state: store.state,
          pinCode: store.pincode,
          country: 'India'
        })
        if (resp?.pickupLocationId) {
          pickupLocation = resp?.pickupLocationId
          await StoreModel.findByIdAndUpdate(store._id, {
            logistics: { shiprocket: { pickupLocation: resp.pickupLocationId } }
          })
        }
      } catch (e) {}
    }

    // STEP 3: Create a new Order in shiprocket
    const logisticsOrder = await Logistics.getAggregator('shiprocket').createOrder({
      orderDetails: {
        pickupLocation: store._id.toString(),
        systemOrderId: order._id.toString(),
        orderDate: moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
        orderId: await generateOrderId(),
        subTotal: subTotal,
        deliveryDetails: {
          phoneNo: (phoneNumber || '')?.replace(/\+91\s*/g, '').replace(/\s+/g, ''),
          country: country,
          state: state,
          city: city,
          address: `${addressLine1}\n${addressLine2}`,
          pinCode: postalCode,
          firstName: userName,
          lastName: ' ',
          email: (order.userId as any).email
        },
        orderItems: orderTracking.items.map((i: any) => ({
          name: i.product.title,
          sku: i.product.sku,
          sellingPrice: i.amount,
          units: i.quantity
        }))
      },
      parcel: {
        destinationPostalCode: postalCode,
        sourcePostalCode: store.pincode,
        weight: orderTracking.weight ?? 0,
        volume: {
          height: orderTracking.volume?.length ?? 0,
          width: orderTracking.volume?.width ?? 0,
          breadth: orderTracking.volume?.breadth ?? 0
        }
      }
    })

    if (!logisticsOrder) throw new Error("Couldn't create order from logistics side")

    logisticsData = {
      logisticsOrderId: logisticsOrder.partnerOrderId,
      shipmentId: logisticsOrder.shipmentId,
      shipmentCreatedAt: new Date()
    }

    // STEP 4: Create a new AWS for the shipment created
    const resp = await (Logistics.getAggregator('shiprocket') as Shiprocket).generateAWB({
      shipmentId: logisticsOrder.shipmentId,
      courierId: parseInt(selectedCourier.id)
    })

    if (resp) {
      logisticsData.awbNo = resp.awbNo
      logisticsData.logisticPartnerCourierId = selectedCourier.id
      logisticsData.logisticPartnerCourierName = selectedCourier.name
    }

    // STEP 5: Create a schedule pickup
    const pickupResp = await (Logistics.getAggregator('shiprocket') as Shiprocket).schedulePickup({
      shipmentId: logisticsOrder.shipmentId
    })

    if (pickupResp) {
      logisticsData.pickupScheduledAt = pickupResp?.pickupDate ? new Date(pickupResp.pickupDate) : null
      const extraData = pickupResp.extraData
      logisticsData.pickupDetails = {
        tokenNo: pickupResp.pickupTokenNo,
        extraData: extraData
      }
      if (extraData?.recommended_courier_data?.etd)
        logisticsData.etd = moment(extraData.recommended_courier_data.etd, 'MMM DD, YYYY').toDate()
    }

    // STEP 6: Create a Manifest
    const generateManifestResp = await (Logistics.getAggregator('shiprocket') as Shiprocket).generateManifest(
      {
        shipmentId: '' + logisticsOrder.shipmentId
      }
    )
    if (generateManifestResp.success) logisticsData.manifestUrl = generateManifestResp.manifestUrl

    // STEP 7: Generate a Label
    const generateLabelResp = await (Logistics.getAggregator('shiprocket') as Shiprocket).generateLabel({
      shipmentId: '' + logisticsOrder.shipmentId
    })

    if (generateLabelResp.success) logisticsData.labelUrl = generateLabelResp.labelUrl

    await OrderItemTrackingModal.findByIdAndUpdate(orderTracking._id, { ...logisticsData })
  } catch (err) {
    if (logisticsData.awbNo)
      await (Logistics.getAggregator('shiprocket') as Shiprocket).cancelShipment({
        awbNo: logisticsData.awbNo
      })

    if (logisticsData.logisticsOrderId)
      await (Logistics.getAggregator('shiprocket') as Shiprocket).cancelOrder(logisticsData.logisticsOrderId)

    throw err
  }
}

const handleCreateShiprocketQuickOrder = async (params: OrderCreateParams) => {
  let logisticsData: any = {}

  try {
    const { order, orderTracking, store, couriers } = params
    const { address: userAddress } = order

    const courierServiceabilityPayload = {
      pickupPostcode: store.pincode,
      latFrom: store?.coordinates.latitude,
      longFrom: store?.coordinates.longitude,
      deliveryPostcode: userAddress.postalCode,
      latTo: userAddress?.coordinates.latitude,
      longTo: userAddress?.coordinates.longitude
    }

    // STEP 1: Checking courier serviceability
    const serviceableCouriers =
      (await Logistics.getAggregator('shiprocketQuick').courierServiceability({
        ...courierServiceabilityPayload
      })) || []

    const whitelistedCourierIds = couriers.map((c: any) => c.partnerCourierId)

    const serviceableWhitelistedCouriers = serviceableCouriers.filter((c: any) =>
      whitelistedCourierIds.includes(c.id)
    )

    // console.log('serviceableWhitelistedCouriers ==>', serviceableWhitelistedCouriers)

    if (serviceableWhitelistedCouriers?.length === 0) throw new Error('No courier service available')

    // Sort by charge and pick less charge courier
    // const selectedCourier = serviceableWhitelistedCouriers.sort((a, b) => a.charges - b.charges)[0]
    const selectedCourier =
      serviceableWhitelistedCouriers[Math.floor(Math.random() * serviceableWhitelistedCouriers.length)]

    // console.log('selectedCourier ==>', selectedCourier)

    if (!selectedCourier) throw new Error('No courier service available')

    const subTotal = await orderTracking.items.reduce((acc: number, curr: any) => {
      acc += curr.quantity * curr.amount
      return acc
    }, 0)

    // STEP 2: Create pickup location and store that pickup location id
    let pickupLocation = (store?.logistics ?? {})?.shiprocketQuick?.pickupLocation
    if (!pickupLocation) {
      const resp = await (
        Logistics.getAggregator('shiprocketQuick') as ShiprocketQuick
      ).addStorePickupLocation({
        pickupLocation: store._id.toString(),
        name: store.storeName,
        email: store.email,
        phone: store.phoneNumber || '',
        address: (store.address || '').replace(/\s+/g, ' ').trim().slice(0, 190),
        city: store.city,
        state: store.state,
        pinCode: store.pincode,
        country: 'India',
        lat: store.coordinates.latitude,
        long: store.coordinates.longitude
      })
      if (resp?.pickupLocationId) {
        pickupLocation = resp?.pickupLocationId
        await StoreModel.findByIdAndUpdate(store._id, {
          logistics: { ...store?.logistics, shiprocketQuick: { pickupLocation: resp.pickupLocationId } }
        })
      }
    }

    // STEP 3: Create a new Order in shiprocket
    const logisticsOrder = await Logistics.getAggregator('shiprocketQuick').createOrder({
      orderDetails: {
        pickupLocation: store._id.toString(),
        systemOrderId: order._id.toString(),
        orderDate: moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
        orderId: `${order?.orderId}:${orderTracking?._id.toString()}`,
        subTotal: subTotal,
        deliveryDetails: {
          phoneNo: (userAddress?.phoneNumber || '')?.replace(/\+91\s*/g, '').replace(/\s+/g, ''),
          country: userAddress?.country,
          state: userAddress?.state,
          city: userAddress?.city,
          address: `${((userAddress?.addressLine1 || '') + '\n' + (userAddress?.addressLine2 || ''))
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 190)}`,
          pinCode: userAddress?.postalCode,
          firstName: userAddress?.userName,
          lastName: ' ',
          email: (order.userId as any).email
        },
        orderItems: orderTracking.items.map((i: any) => ({
          name: i.product.title,
          sku: i.product.sku,
          sellingPrice: i.amount,
          units: i.quantity
        }))
      },
      deliveryCoordinates: {
        latitude: userAddress?.coordinates.latitude,
        longitude: userAddress?.coordinates.longitude
      },
      parcel: {
        destinationPostalCode: userAddress?.postalCode,
        sourcePostalCode: store.pincode,
        weight: orderTracking.weight ?? 0,
        volume: {
          height: orderTracking.volume?.length ?? 0,
          width: orderTracking.volume?.width ?? 0,
          breadth: orderTracking.volume?.breadth ?? 0
        }
      }
    })

    if (!logisticsOrder) throw new Error("Couldn't create order from logistics side")

    logisticsData = {
      logisticsOrderId: logisticsOrder.partnerOrderId,
      shipmentId: logisticsOrder.shipmentId,
      shipmentCreatedAt: new Date()
    }

    // STEP 4: Create a new AWS for the shipment created
    await (Logistics.getAggregator('shiprocketQuick') as ShiprocketQuick).generateAWB({
      shipmentId: logisticsOrder.shipmentId,
      courierId: parseInt(selectedCourier.id)
    })

    logisticsData.logisticPartnerCourierId = selectedCourier.id
    logisticsData.logisticPartnerCourierName = selectedCourier.name

    await OrderItemTrackingModal.findByIdAndUpdate(orderTracking._id, { ...logisticsData })
  } catch (err) {
    // if (logisticsData.logisticsOrderId)
    //   await (Logistics.getAggregator('shiprocketQuick') as ShiprocketQuick).cancelOrder({
    //     ids: [logisticsData.logisticsOrderId]
    //   })

    throw err
  }
}

export const handleCreateDelhiveryOrder = async (params: OrderCreateParams) => {
  let logisticsData: {
    logisticsOrderId?: string
    shipmentCreatedAt?: Date
    pickupScheduledAt?: string
    labelUrl?: string
    pickupId?: number
  } = {}

  try {
    const { order, orderTracking, store, couriers } = params
    const { address: userAddress } = order

    // STEP 1: Checking courier serviceability
    const serviceableCouriers =
      (await Logistics.getAggregator(AVAILABLE_LOGISTICS.DELHIVERY).courierServiceability({
        originPin: store.pincode,
        destinationPin: userAddress.postalCode
      })) || []

    // const whitelistedCourierIds = couriers.map((c: any) => c.partnerCourierId)

    // const serviceableWhitelistedCouriers = serviceableCouriers.filter((c: any) =>
    //   whitelistedCourierIds.includes(c.id)
    // )

    if (!serviceableCouriers || serviceableCouriers?.length === 0)
      throw new Error('No courier service available')

    // const selectedCourier =
    //   serviceableWhitelistedCouriers[Math.floor(Math.random() * serviceableWhitelistedCouriers.length)]

    // if (!selectedCourier) throw new Error('No courier service available')

    // console.log('STEP 1: Done', selectedCourier)

    // STEP 2: Warehouse Setup
    let pickupLocation = (store?.logistics ?? {})?.delhivery?.pickupLocation

    const createPickupLocation = async () => {
      const resp = await (
        Logistics.getAggregator(AVAILABLE_LOGISTICS.DELHIVERY) as DelhiveryClient
      ).addStorePickupLocation({
        phone: store.phoneNumber,
        city: store.city,
        name: store.storeName,
        pin: store.pincode,
        address: store.address
          .replace(/"+/g, '"')
          .replace(/\s{2,}/g, ' ')
          .trim(),
        country: 'India',
        email: store.email,
        return_address: store.address,
        return_pin: store.pincode,
        return_city: store.city,
        return_state: store.state,
        return_country: 'India'
      })

      if (resp?.pickupLocation) {
        pickupLocation = resp?.pickupLocation
        await StoreModel.findByIdAndUpdate(store._id, {
          logistics: { ...store?.logistics, delhivery: { pickupLocation: resp.pickupLocation } }
        })
      }
    }

    // console.log('STEP 2: Done', pickupLocation)
    if (!pickupLocation) await createPickupLocation()

    // STEP 3: Shipment Creation

    // To make order Id unique, add splitTrackingId along with orderId
    const totalOrderTrackings = await OrderItemTrackingModal.countDocuments({
      order: order?._id,
      type: 'order'
    })

    const generateOrderId = () => {
      if (totalOrderTrackings === 1) return order?.orderId

      // Attach splitTrackingId
      return `${order?.orderId}S${orderTracking?.splitTrackingId ?? 1}`
    }

    const createDelhiveryOrder = async () => {
      return await Logistics.getAggregator(AVAILABLE_LOGISTICS.DELHIVERY).createOrder({
        shipments: [
          {
            name: userAddress.userName,
            add: `${((userAddress?.addressLine1 || '') + '\n' + (userAddress?.addressLine2 || ''))
              .replace(/\s+/g, ' ')
              .trim()}`,
            pin: userAddress.postalCode,
            city: userAddress.city,
            state: userAddress.state,
            country: 'India',
            phone: (userAddress?.phoneNumber || '')?.replace(/\+91\s*/g, '').replace(/\s+/g, ''),
            order: generateOrderId(),
            payment_mode: 'Prepaid',
            return_pin: '',
            return_city: '',
            return_phone: '',
            return_add: '',
            return_state: '',
            return_country: '',
            products_desc: '',
            hsn_code: '',
            cod_amount: '',
            order_date: null,
            total_amount: '',
            seller_add: '',
            seller_name: '',
            seller_inv: '',
            quantity: '',
            waybill: '',
            shipment_width: orderTracking?.volume?.width,
            shipment_height: orderTracking?.volume?.length,
            weight: '',
            shipping_mode: 'Express',
            address_type: ''
          }
        ],
        pickup_location: {
          name: pickupLocation
        }
      })
    }

    const logisticsOrder = await createDelhiveryOrder()

    // Incase pickuplocation is not available, create new
    if (logisticsOrder?.createPickupLocation) {
      await createPickupLocation()
      await createDelhiveryOrder()
    }

    // console.log('STEP 3: Done', logisticsOrder)

    if (!logisticsOrder) throw new Error("Couldn't create order from logistics side")

    logisticsData.logisticsOrderId = logisticsOrder.partnerOrderId
    logisticsData.shipmentCreatedAt = new Date()

    // STEP 4: Create a schedule pickup

    const pickupDate = moment().tz('Asia/Kolkata').add(30, 'minutes')

    const pickupResp = await (
      Logistics.getAggregator(AVAILABLE_LOGISTICS.DELHIVERY) as DelhiveryClient
    ).schedulePickup({
      pickup_time: pickupDate.format('HH:mm:ss'),
      pickup_date: pickupDate.format('YYYY-MM-DD'),
      pickup_location: pickupLocation,
      expected_package_count: 1
    })

    // console.log('STEP 4: Done', pickupResp)

    if (pickupResp) {
      logisticsData.pickupId = pickupResp.pickup_id
      logisticsData.pickupScheduledAt = pickupResp.pickupScheduledAt ?? ''
    }

    // STEP 5: Generate a Label
    const generateLabelResp = await (
      Logistics.getAggregator(AVAILABLE_LOGISTICS.DELHIVERY) as DelhiveryClient
    ).generateLabel({
      waybill: logisticsData.logisticsOrderId ?? ''
    })

    // console.log('STEP 5: Done', generateLabelResp)
    if (generateLabelResp.labelUrl) {
      try {
        // Download the label from Delhivery and upload to S3, then get CloudFront URL
        const cloudFrontLabelUrl = await downloadAndUploadLabelToS3({
          labelUrl: generateLabelResp.labelUrl,
          waybill: logisticsData.logisticsOrderId ?? ''
        })
        logisticsData.labelUrl = cloudFrontLabelUrl
      } catch (error) {
        console.error('Failed to download and upload label to S3:', error)
        // Fallback to original URL if S3 upload fails
        logisticsData.labelUrl = generateLabelResp.labelUrl
      }
    }

    await OrderItemTrackingModal.findByIdAndUpdate(orderTracking._id, { ...logisticsData })
  } catch (err) {
    if (logisticsData.logisticsOrderId)
      await (Logistics.getAggregator(AVAILABLE_LOGISTICS.DELHIVERY) as DelhiveryClient).cancelOrder({
        waybill: logisticsData.logisticsOrderId
      })

    throw err
  }
}

export const rescheduleLogisticsPickup = async (orderTrackingId: string | Types.ObjectId) => {
  try {
    const orderTracking = await OrderItemTrackingModal.findById(orderTrackingId).lean()
    if (!orderTracking) throw new Error('Order tracking not found')

    if (!orderTracking?.shipmentId) throw new Error('Logistics shipment id not found')

    const pickupResp = await (Logistics.getAggregator('shiprocket') as Shiprocket).reSchedulePickup({
      shipmentId: orderTracking.shipmentId
    })

    let logisticsData: any = {}

    if (pickupResp) {
      logisticsData.pickupScheduledAt = new Date(pickupResp.pickupDate)
      const extraData = pickupResp.extraData
      logisticsData.pickupDetails = {
        tokenNo: pickupResp.pickupTokenNo,
        extraData: extraData
      }
      if (extraData?.recommended_courier_data?.etd)
        logisticsData.etd = moment(extraData.recommended_courier_data.etd, 'MMM DD, YYYY').toDate()
    }

    const generateManifestResp = await (Logistics.getAggregator('shiprocket') as Shiprocket).generateManifest(
      {
        shipmentId: '' + orderTracking.shipmentId
      }
    )
    if (generateManifestResp.success) logisticsData.manifestUrl = generateManifestResp.manifestUrl

    const generateLabelResp = await (Logistics.getAggregator('shiprocket') as Shiprocket).generateLabel({
      shipmentId: '' + orderTracking.shipmentId
    })
    if (generateLabelResp.success) logisticsData.labelUrl = generateLabelResp.labelUrl

    await OrderItemTrackingModal.findByIdAndUpdate(orderTracking._id, { ...logisticsData })
  } catch (e) {
    throw e
    // console.log('rescheduleLogisticsPickup error', e)
  }
}

const generateOrderId = async () => {
  const total = await OrderItemTrackingModal.countDocuments({})
  const randomNo = generateRandomNumber(4)
  const timestamp = moment().format('YYYYMMDD')
  return `${timestamp}-${total}-${randomNo}`
}

export const cancelLogisticsOrder = async (orderTrackingId: string | Types.ObjectId) => {
  try {
    const orderTracking: any = await OrderItemTrackingModal.findById(orderTrackingId).lean()
    if (!orderTracking) throw new Error('Order tracking not found')
    const deliveryMode = orderTracking.deliveryMode

    // console.log('Delivery Mode ==>', deliveryMode)

    const order: any = await OrderModel.findById(orderTracking.order).lean()
    if (!order) throw new Error('Order not found')

    if (deliveryMode === DELIVERY_MODES.STANDARD) {
      await handleCancelDelhiveryOrder({ orderTracking })
      // else {
      //   // TODO: Handle multiple standard delivery modes
      //   const partner = STANDARD_DELIVERY_LOGISTICS[0]
      //   if (partner === 'shiprocket') await handleCancelShiprocketOrder({ orderTracking })
      // }
    } else if (deliveryMode === DELIVERY_MODES.ONE_DAY) {
      await handleCancelShiprocketQuickOrder({ orderTracking })
    }
  } catch (err) {
    // console.log('Could not cancel logistics order', orderTrackingId?.toString())
    throw err
  }
}

const handleCancelShiprocketOrder = async ({ orderTracking }: { orderTracking: any }) => {
  if (orderTracking.awbNo) {
    await (Logistics.getAggregator('shiprocket') as Shiprocket).cancelShipment({
      awbNo: orderTracking.awbNo
    })
  }
  if (orderTracking.logisticsOrderId)
    await Logistics.getAggregator('shiprocket').cancelOrder(`${orderTracking.logisticsOrderId}`, {})
}

const handleCancelShiprocketQuickOrder = async ({ orderTracking }: { orderTracking: any }) => {
  if (orderTracking.logisticsOrderId)
    await Logistics.getAggregator('shiprocketQuick').cancelOrder(`${orderTracking.logisticsOrderId}`, {})
}

const handleCancelDelhiveryOrder = async ({ orderTracking }: { orderTracking: any }) => {
  if (orderTracking.logisticsOrderId)
    await (Logistics.getAggregator(AVAILABLE_LOGISTICS.DELHIVERY) as DelhiveryClient).cancelOrder({
      waybill: `${orderTracking.logisticsOrderId}`
    })
}

export const createItemReturnOrder = async (orderTrackingId: string | Types.ObjectId) => {
  try {
    const orderTracking = await OrderItemTrackingModal.findById(orderTrackingId)
      .populate({ path: 'items', populate: { path: 'product' } })
      .lean()
    if (!orderTracking) throw new Error('Order tracking not found')

    const order = await OrderModel.findById(orderTracking.order).lean()
    if (!order) throw new Error('Order not found')

    const store = await StoreModel.findById(orderTracking.store).lean()
    if (!store) throw new Error('Store not found')

    const deliveryPolicy = await DeliveryPoliciesModel.findOne({ stores: orderTracking.store }).lean()
    if (!deliveryPolicy) throw new Error('Delivery policy not found')

    const logisticsRule = await LogisticsRulesModel.findOne({ deliveryZones: deliveryPolicy._id }).lean()
    if (!logisticsRule) throw new Error('Logistics rule not found for this delivery policy')

    const deliveryMode = orderTracking?.deliveryMode ?? DELIVERY_MODES.STANDARD

    const couriers = (logisticsRule.couriers ?? []).filter((courier) => courier.deliveryMode === deliveryMode)

    if (!couriers?.length) throw new Error('No couriers are added in this rule')

    // console.log('Delivery Mode ==>', deliveryMode)

    if (deliveryMode === DELIVERY_MODES.STANDARD) {
      // TODO: Handle multiple standard delivery modes
      // const partner = STANDARD_DELIVERY_LOGISTICS[0]
      // if (partner === 'shiprocket') await handleShiprocketReturnOrder({ orderTracking, order, store })
    } else if (deliveryMode === DELIVERY_MODES.ONE_DAY) {
      await handleShiprocketQuickReturnOrder({ orderTracking, store, order, couriers })
    }
  } catch (err) {
    throw err
  }
}

const handleShiprocketReturnOrder = async ({
  orderTracking,
  order,
  store
}: {
  orderTracking: any
  order: any
  store: any
}) => {
  let logisticsData: any = {}
  try {
    const deliveryPolicy = await DeliveryPoliciesModel.findOne({ stores: orderTracking.store }).lean()
    if (!deliveryPolicy) throw new Error('Delivery policy not found')

    const logisticsRule = await LogisticsRulesModel.findOne({ deliveryZones: deliveryPolicy._id }).lean()
    if (!logisticsRule) throw new Error('Logistics rule not found for this delivery policy')

    const couriers = logisticsRule.couriers
    if (!couriers?.length) throw new Error('No couriers are added in this rule')

    const {
      address: { userName, phoneNumber, addressLine1, addressLine2, postalCode, city, state, country }
    } = order

    const serviceableCouriers =
      (await Logistics.getAggregator('shiprocket').courierServiceability({
        parcel: {
          volume: {
            height: orderTracking?.volume?.length as number,
            width: orderTracking?.volume?.width as number,
            breadth: orderTracking?.volume?.breadth as number
          },
          weight: orderTracking?.weight as number,
          sourcePostalCode: postalCode,
          destinationPostalCode: store.pincode
        },
        isReturn: true
      })) || []

    const packageSize = orderTracking.packageSize ?? 'small'

    const whitelistedCourierIds = couriers
      .filter((c) => c.packageSize?.includes(packageSize))
      .map((c) => c.partnerCourierId)

    const serviceableWhitelistedCouriers = serviceableCouriers.filter((c: any) =>
      whitelistedCourierIds.includes(c.id)
    )

    if (serviceableWhitelistedCouriers?.length === 0) throw new Error('No courier service available')

    const selectedCourier =
      serviceableWhitelistedCouriers[Math.floor(Math.random() * serviceableWhitelistedCouriers.length)]

    // console.log('selectedCourier ==>', selectedCourier)

    const orderParamItems: ReturnOrderItem[] = orderTracking.items.map((item: any) => {
      const { product, quantity } = item
      return {
        name: product.title,
        sku: product.sku,
        sellingPrice: product.finalPrice,
        units: quantity,
        qc_enable: false,
        qc_product_name: product.title
      }
    })

    const subTotal = orderParamItems.reduce((acc, curr) => curr.units * curr.sellingPrice, 0)

    const params: ReturnOrderParams = {
      customerAddress: {
        phoneNo: phoneNumber,
        country: country,
        state: state,
        city: city,
        address: `${addressLine1}\n${addressLine2}`,
        pinCode: postalCode,
        firstName: userName,
        lastName: ' ',
        email: (order.userId as any).email
      },
      storeAddress: {
        firstName: store.storeName,
        lastName: '',
        address: store.address as string,
        city: store.city,
        state: store.state,
        pinCode: Number(store.pincode),
        country: 'India',
        phoneNo: Number(store.phoneNumber),
        email: store.email
      },
      orderDetails: {
        orderId: orderTracking.orderLogistics?.logisticsOrderId as string,
        orderDate: moment(orderTracking.orderLogistics?.shipmentCreatedAt)
          .tz('Asia/Kolkata')
          .format('YYYY-MM-DD'),
        subTotal: subTotal,
        orderItems: orderParamItems
      },
      parcel: {
        volume: {
          height: orderTracking.volume?.length as number,
          breadth: orderTracking.volume?.breadth as number,
          width: orderTracking.volume?.width as number
        },
        weight: orderTracking.weight as number,
        sourcePostalCode: postalCode,
        sourceLatlng: {
          lat: 0,
          lng: 0
        },
        destinationPostalCode: store.pincode,
        destinationLatlng: {
          lat: 0,
          lng: 0
        }
      }
    }

    const logisticsOrder = await Logistics.createReturnOrder('shiprocket', params)

    if (!logisticsOrder) throw new Error("Couldn't create order from logistics side")

    logisticsData = {
      logisticsOrderId: logisticsOrder.orderId,
      shipmentId: logisticsOrder.shipmentId,
      shipmentCreatedAt: new Date()
    }
    const resp = await (Logistics.getAggregator('shiprocket') as Shiprocket).generateAWB({
      shipmentId: Number(logisticsOrder.shipmentId),
      // courierId: parseInt(selectedCourier.id),
      isReturn: true
    })

    if (resp) {
      logisticsData.awbNo = resp.awbNo
      logisticsData.logisticPartnerCourierId = selectedCourier.id
      logisticsData.logisticPartnerCourierName = selectedCourier.name
    }

    // const pickupResp = await (Logistics.getAggregator('shiprocket') as Shiprocket).schedulePickup({
    //   shipmentId: Number(logisticsOrder.shipmentId)
    // })
    // if (pickupResp) {
    //   logisticsData.pickupScheduledAt = new Date(pickupResp.pickupDate)
    //   const extraData = pickupResp.extraData
    //   logisticsData.pickupDetails = {
    //     tokenNo: pickupResp.pickupTokenNo,
    //     extraData: extraData
    //   }
    //   if (extraData?.recommended_courier_data?.etd)
    //     logisticsData.etd = moment(extraData.recommended_courier_data.etd, 'MMM DD, YYYY').toDate()
    // }

    // const generateManifestResp = await (Logistics.getAggregator('shiprocket') as Shiprocket).generateManifest(
    //   {
    //     shipmentId: '' + logisticsOrder.shipmentId
    //   }
    // )

    // if (generateManifestResp.success) logisticsData.manifestUrl = generateManifestResp.manifestUrl

    // const generateLabelResp = await (Logistics.getAggregator('shiprocket') as Shiprocket).generateLabel({
    //   shipmentId: '' + logisticsOrder.shipmentId
    // })
    // if (generateLabelResp.success) logisticsData.labelUrl = generateLabelResp.labelUrl

    await OrderItemTrackingModal.findByIdAndUpdate(orderTracking._id, { ...logisticsData })
  } catch (err) {
    // console.log('Could not create return order')
    if (logisticsData.awbNo) {
      await (Logistics.getAggregator('shiprocket') as Shiprocket).cancelShipment({
        awbNo: logisticsData.awbNo
      })
    }
    if (logisticsData.logisticsOrderId) {
      await Logistics.getAggregator('shiprocket').cancelOrder(logisticsData.logisticsOrderId, {})
    }
    throw err
  }
}

const handleShiprocketQuickReturnOrder = async (params: any) => {
  let logisticsData: any = {}

  try {
    const { order, orderTracking, store, couriers } = params
    const { address: userAddress } = order

    const courierServiceabilityPayload = {
      pickupPostcode: userAddress.postalCode,
      latFrom: userAddress?.coordinates.latitude,
      longFrom: userAddress?.coordinates.longitude,
      deliveryPostcode: store.pincode,
      latTo: store.coordinates.latitude,
      longTo: store.coordinates.longitude
    }

    const user: any = await UsersModel.findById(userAddress?.userId).select('_id email').lean()

    // STEP 1: Checking courier serviceability
    const serviceableCouriers =
      (await Logistics.getAggregator('shiprocketQuick').courierServiceability({
        ...courierServiceabilityPayload
      })) || []

    const whitelistedCourierIds = (couriers ?? []).map((c: any) => c.partnerCourierId)

    const serviceableWhitelistedCouriers = serviceableCouriers.filter((c: any) =>
      whitelistedCourierIds.includes(c.id)
    )

    // console.log('serviceableWhitelistedCouriers ==>', serviceableWhitelistedCouriers.length)

    if (serviceableWhitelistedCouriers?.length === 0) throw new Error('No courier service available')

    // Sort by charge and pick less charge courier
    // const selectedCourier = serviceableWhitelistedCouriers.sort((a, b) => a.charges - b.charges)[0]
    const selectedCourier =
      serviceableWhitelistedCouriers[Math.floor(Math.random() * serviceableWhitelistedCouriers.length)]

    // console.log('selectedCourier ==>', selectedCourier)

    if (!selectedCourier) throw new Error('No courier service available')

    const subTotal = await orderTracking.items.reduce((acc: number, curr: any) => {
      acc += curr.quantity * curr.amount
      return acc
    }, 0)

    // STEP 2: Create pickup location and store that pickup location id
    await (Logistics.getAggregator('shiprocketQuick') as ShiprocketQuick).addStorePickupLocation({
      pickupLocation: userAddress._id.toString(),
      name: userAddress.userName,
      email: user?.email,
      phone: userAddress.phoneNumber || '',
      address: (userAddress.fullAddress || '').replace(/\s+/g, ' ').trim().slice(0, 190),
      city: userAddress.city,
      state: userAddress.state,
      pinCode: userAddress.postalCode,
      country: 'India',
      lat: userAddress.coordinates.latitude,
      long: userAddress.coordinates.longitude
    })

    // STEP 3: Create a new Order in shiprocket
    const logisticsOrder = await Logistics.getAggregator('shiprocketQuick').createOrder({
      orderDetails: {
        pickupLocation: userAddress._id.toString(),
        systemOrderId: order._id.toString(),
        orderDate: moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
        orderId: 'return:' + order?.orderId,
        subTotal: subTotal,
        deliveryDetails: {
          firstName: store?.storeName,
          lastName: '',
          email: store?.email,
          phoneNo: (store?.phoneNumber || '')?.replace(/\+91\s*/g, '').replace(/\s+/g, ''),
          address: (store?.address || '').replace(/\s+/g, ' ').trim().slice(0, 190),
          city: store?.city,
          state: store?.state,
          pinCode: store?.pincode,
          country: 'India'
        },
        orderItems: orderTracking.items.map((i: any) => ({
          name: i.product.title,
          sku: i.product.sku,
          sellingPrice: i.amount,
          units: i.quantity
        }))
      },
      deliveryCoordinates: {
        latitude: store.coordinates.latitude,
        longitude: store.coordinates.longitude
      },
      parcel: {
        destinationPostalCode: userAddress?.postalCode,
        sourcePostalCode: store.pincode,
        weight: orderTracking.weight ?? 0,
        volume: {
          height: orderTracking.volume?.length ?? 0,
          width: orderTracking.volume?.width ?? 0,
          breadth: orderTracking.volume?.breadth ?? 0
        }
      }
    })

    if (!logisticsOrder) throw new Error("Couldn't create order from logistics side")

    logisticsData = {
      logisticsOrderId: logisticsOrder.partnerOrderId,
      shipmentId: logisticsOrder.shipmentId,
      shipmentCreatedAt: new Date()
    }

    // STEP 4: Create a new AWS for the shipment created
    await (Logistics.getAggregator('shiprocketQuick') as ShiprocketQuick).generateAWB({
      shipmentId: logisticsOrder.shipmentId,
      courierId: parseInt(selectedCourier.id)
    })

    logisticsData.logisticPartnerCourierId = selectedCourier.id
    logisticsData.logisticPartnerCourierName = selectedCourier.name

    await OrderItemTrackingModal.findByIdAndUpdate(orderTracking._id, { ...logisticsData })
  } catch (err) {
    if (logisticsData.logisticsOrderId)
      await (Logistics.getAggregator('shiprocketQuick') as ShiprocketQuick).cancelOrder(
        logisticsData.logisticsOrderId
      )

    throw err
  }
}
