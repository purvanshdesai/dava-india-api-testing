// delhivery.test.ts
import axios from 'axios'
import { DelhiveryClient } from './delhivery'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('DelhiveryClient', () => {
  let client: DelhiveryClient

  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.create.mockReturnValue(mockedAxios as any)
    client = new DelhiveryClient({ token: 'test-token', env: 'staging' })
  })

  describe('courierServiceability', () => {
    it('should return deliverable codes without TAT', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          delivery_codes: [
            {
              postal_code: {
                pickup: 'Y',
                max_amount: 100
              }
            }
          ]
        }
      })

      const res = await client.courierServiceability({
        originPin: '560001',
        destinationPin: '110001'
      })

      expect(res).toEqual([
        {
          id: 'delhivery-tracking',
          name: 'Delhivery Tracking',
          charges: 100,
          etd: '',
          etdDays: 0,
          etdHours: 0
        }
      ])
    })

    it('should enrich with TAT and cost when fetchTat = true', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            delivery_codes: [{ postal_code: { pickup: 'Y', max_amount: 50 } }]
          }
        })
        .mockResolvedValueOnce({ data: { success: true, data: { tat: 2 } } }) // checkExpectedTAT
        .mockResolvedValueOnce({ data: [{ total_amount: 200 }] }) // calculateShippingCost

      const res = await client.courierServiceability({
        originPin: '560001',
        destinationPin: '110001',
        fetchTat: true
      })

      expect(res[0].etdDays).toBe(2)
      expect(res[0].charges).toBe(200)
      expect(res[0].etd).toMatch(/^\d{4}-\d{2}-\d{2}$/) // formatted date
    })

    it('should throw error when no delivery codes', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { delivery_codes: [] } })

      await expect(
        client.courierServiceability({ originPin: '560001', destinationPin: '110001' })
      ).rejects.toThrow('No center available for this pincode!')
    })
  })

  it('checkExpectedTAT should return tat if success', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { success: true, data: { tat: 3 } } })
    const res = await client.checkExpectedTAT({ originPin: '560001', destinationPin: '110001' })
    expect(res).toBe(3)
  })

  it('calculateShippingCost should return cost if available', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [{ total_amount: 500 }] })
    const res = await client.calculateShippingCost({ originPin: '560001', destinationPin: '110001' })
    expect(res).toBe(500)
  })

  it('createOrder should return partnerOrderId when success', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, packages: [{ waybill: 'WB123' }] }
    })

    const res = await client.createOrder({} as any)
    expect(res).toEqual({ partnerOrderId: 'WB123' })
  })

  it('createOrder should return null when failed', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { success: false, packages: null } })
    const res = await client.createOrder({} as any)
    expect(res).toBeNull()
  })

  it('cancelOrder should return data on success', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true }, status: 200 })
    const res = await client.cancelOrder({ waybill: 'WB123' })
    expect(res).toEqual({ success: true })
  })

  it('updateShipment should call axios.post with correct data', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } })
    const res = await client.updateShipment('WB123', { phone: '9999999999' })
    expect(res).toEqual({ success: true })
    expect(mockedAxios.post).toHaveBeenCalled()
  })

  it('trackByWaybill should return tracking data', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { Status: 'In Transit' } })
    const res = await client.trackByWaybill('WB123')
    expect(res).toEqual({ Status: 'In Transit' })
  })

  it('addStorePickupLocation should return pickupLocation on success', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true, data: { name: 'WH1' } } })
    const res = await client.addStorePickupLocation({} as any)
    expect(res).toEqual({ pickupLocation: 'WH1' })
  })

  it('schedulePickup should include pickupScheduledAt if date+time provided', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { pickup_date: '2025-08-30', pickup_time: '10:00-12:00' }
    })
    const res = await client.schedulePickup({} as any)
    expect(res.pickupScheduledAt).toBe('2025-08-30 10:00-12:00')
  })

  it('generateLabel should return labelUrl when available', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { packages: [{ pdf_download_link: 'http://label.pdf' }] }
    })
    const res = await client.generateLabel({ waybill: 'WB123' })
    expect(res).toEqual({ labelUrl: 'http://label.pdf' })
  })

  it('generateLabel should return null when no packages', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { packages: [] } })
    const res = await client.generateLabel({ waybill: 'WB123' })
    expect(res).toEqual({ labelUrl: null })
  })
})
