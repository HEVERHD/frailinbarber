import { getColombiaTime, getColombiaDayOfWeek, parseColombia } from "@/lib/utils"

// Same booking rules as /api/appointments/slots: days off, per-day schedules,
// existing appointments, one-time and recurring blocks, past times today.

type Settings = { openTime: string; closeTime: string; daysOff: string; daySchedules: string | null }
type Appointment = { date: Date; service: { duration: number } }
type Blocked = { date: string; startTime: string; endTime: string; allDay: boolean }
type Recurring = { startTime: string; endTime: string; allDay: boolean; daysOfWeek: string }

const SLOT_INTERVAL = 15

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

/**
 * How many back-to-back appointments of `duration` minutes still fit on `dateStr`
 * (YYYY-MM-DD, Colombia). Greedy: each booked slot skips ahead by its duration,
 * so the result is real "cupos", not overlapping start times.
 */
export function countBookableSlots(
  dateStr: string,
  duration: number,
  settings: Settings,
  appointments: Appointment[],
  blockedSlots: Blocked[],
  recurringBlocks: Recurring[],
  now: Date = new Date(),
): number {
  const dayStart = parseColombia(dateStr + "T00:00:00")
  const dayOfWeek = getColombiaDayOfWeek(dayStart)

  const daysOff = settings.daysOff.split(",").filter(Boolean).map(Number)
  if (daysOff.includes(dayOfWeek)) return 0

  const dayBlocks = blockedSlots.filter((b) => b.date === dateStr)
  if (dayBlocks.some((b) => b.allDay)) return 0

  let open = settings.openTime
  let close = settings.closeTime
  if (settings.daySchedules) {
    try {
      const schedules = JSON.parse(settings.daySchedules) as Record<string, { open: string; close: string }>
      const s = schedules[String(dayOfWeek)]
      if (s) { open = s.open; close = s.close }
    } catch {}
  }

  // Colombia current time (UTC-5, no DST)
  const nowCol = new Date(now.getTime() - 5 * 60 * 60 * 1000)
  const todayCol = nowCol.toISOString().slice(0, 10)
  const currentMinutes = nowCol.getUTCHours() * 60 + nowCol.getUTCMinutes()
  if (dateStr < todayCol) return 0

  const dayEnd = parseColombia(dateStr + "T23:59:59")
  const dayAppointments = appointments
    .filter((a) => a.date >= dayStart && a.date <= dayEnd)
    .map((a) => {
      const t = getColombiaTime(new Date(a.date))
      const start = t.hours * 60 + t.minutes
      return { start, end: start + a.service.duration }
    })

  let count = 0
  const endMinutes = toMin(close)
  for (let m = toMin(open); m + duration <= endMinutes; ) {
    const slotEnd = m + duration
    const free =
      !(dateStr === todayCol && m < currentMinutes) &&
      !dayAppointments.some((a) => m < a.end && slotEnd > a.start) &&
      !dayBlocks.some((b) => m < toMin(b.endTime) && slotEnd > toMin(b.startTime)) &&
      !recurringBlocks.some((r) => {
        if (r.daysOfWeek && !r.daysOfWeek.split(",").map(Number).includes(dayOfWeek)) return false
        if (r.allDay) return true
        return m < toMin(r.endTime) && slotEnd > toMin(r.startTime)
      })

    if (free) {
      count++
      m += duration
    } else {
      m += SLOT_INTERVAL
    }
  }
  return count
}
