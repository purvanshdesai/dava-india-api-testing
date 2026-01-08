import moment from 'moment'
import redis from '../cache/redis'
import { ConsultationAppointmentSlotsModel } from '../services/consultancy-appointment-slots/consultancy-appointment-slots.schema'
import { DataSessionPage } from 'twilio/lib/rest/wireless/v1/sim/dataSession'
const redisInstance = redis.getInstance()

//  util to get slots for the date
export async function getSlotsForDate(requestedDateStr: string) {
  const IST_TIMEZONE = 'Asia/Kolkata'
  const now = moment().tz(IST_TIMEZONE)
  const today = moment().tz(IST_TIMEZONE).startOf('day')
  const requestedDate = moment(requestedDateStr).tz(IST_TIMEZONE).startOf('day')
  const diffInDays = requestedDate.diff(today, 'days')

  // Only allow today, unless after 8pm, then only allow next day
  const currentHour = now.hour()
  // if (currentHour < 20) {
  //   if (!requestedDate.isValid() || diffInDays !== 0) {
  //     throw new Error('You can only book slots for today.')
  //   }
  // } else {
  //   if (!requestedDate.isValid() || diffInDays !== 1) {
  //     throw new Error('You can only book slots for tomorrow after 8pm.')
  //   }
  // }

  const redisKey = `slots:${requestedDateStr}`

  // 2. Try Redis
  const cached = await redisInstance.get(redisKey)
  if (cached) {
    const parsed = JSON.parse(cached)
    return filterAvailableSlots(parsed)
  }

  // 3. Try MongoDB
  const existing = await ConsultationAppointmentSlotsModel.find({ date: requestedDateStr }).lean()
  if (existing.length > 0) {
    await redisInstance.set(redisKey, JSON.stringify(existing), 'EX', 86400)
    return filterAvailableSlots(existing)
  }

  // 4. Generate new slots
  const generated = generateSlots(requestedDateStr)
  const saved = await ConsultationAppointmentSlotsModel.insertMany(generated)
  const plainSaved = saved.map((doc) => (doc.toObject ? doc.toObject() : doc))
  await redisInstance.set(redisKey, JSON.stringify(plainSaved), 'EX', 86400)
  return filterAvailableSlots(plainSaved)
}

// util to generate slots
export function generateSlots(date: string) {
  const startHour = 9
  const endHour = 20 // changed from 18 to 20 for 8 pm
  const slots = []

  for (let h = startHour; h < endHour; h++) {
    for (let m of [0, 30]) {
      const startTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
      const endMinutes = m + 30
      const endHour = h + Math.floor(endMinutes / 60)
      const endMin = endMinutes % 60
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`

      slots.push({
        date,
        startTime,
        endTime,
        maxAppointments: 10,
        appointments: [],
        availableCount: 10
      })
    }
  }

  return slots
}

// util to filter available slots
export function filterAvailableSlots(slots: any) {
  return slots.filter((slot: any) => slot.availableCount > 0)
}

// reserving slots
export async function reserveSlot(date: string, startTime: string, appointmentId: string) {
  // Step 1: Find and update slot atomically
  const normalizedDate = new Date(date)

  const slot = await ConsultationAppointmentSlotsModel.findOneAndUpdate(
    {
      date: normalizedDate,
      startTime: startTime,
      availableCount: { $gt: 0 }
    },
    {
      $push: {
        appointments: appointmentId
      },
      $inc: { availableCount: -1 }
    },
    {
      new: true
    }
  )

  if (!slot) {
    throw new Error('Slot not available or fully booked.')
  }

  // Step 2: Update Redis cache (if exists)
  const redisKey = `slots:${date}`
  const cached = await redisInstance.get(redisKey)
  if (cached) {
    const slots = JSON.parse(cached)
    const updatedSlots = slots.map((s: any) => {
      if (s.startTime === startTime) {
        return {
          ...s,
          appointments: [...s.appointments, appointmentId],
          availableCount: s.availableCount - 1
        }
      }
      return s
    })

    await redisInstance.set(redisKey, JSON.stringify(updatedSlots), 'EX', 86400)
  }

  return slot
}

// check slot availablility
export async function checkSlotAvailability(date: string, startTime: string) {
  // Step 1: Find and update slot atomically
  const normalizedDate = new Date(date)
  console.log(date)
  console.log(startTime)

  const slot = await ConsultationAppointmentSlotsModel.findOne({
    date: normalizedDate,
    startTime: startTime,
    availableCount: { $gt: 0 }
  })
  console.log(slot)

  if (!slot) {
    throw new Error('Slot not available or fully booked.')
  }

  return slot
}

// convert time

export function convertTo24Hour(timeRange: string): string {
  const [startTime] = timeRange.split(' - ')
  const [time, meridiem] = startTime.split(' ')
  let [hour, minute] = time.split(':').map(Number)

  if (meridiem === 'PM' && hour !== 12) hour += 12
  if (meridiem === 'AM' && hour === 12) hour = 0

  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}
