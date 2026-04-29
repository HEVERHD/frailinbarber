import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseColombia, getColombiaTime, getColombiaDayOfWeek } from "@/lib/utils"

export const dynamic = "force-dynamic"

type DayStatus = "available" | "partial" | "full" | "off"

const SLOT_INTERVAL = 15
const PARTIAL_THRESHOLD = 3 // ≤ this many slots = "partial"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get("startDate") // YYYY-MM-DD
  const endDate = searchParams.get("endDate")     // YYYY-MM-DD
  const serviceId = searchParams.get("serviceId")
  const barberId = searchParams.get("barberId")

  if (!startDate || !endDate || !serviceId || !barberId) {
    return NextResponse.json({ error: "startDate, endDate, serviceId and barberId required" }, { status: 400 })
  }

  const rangeStart = parseColombia(startDate + "T00:00:00")
  const rangeEnd = parseColombia(endDate + "T23:59:59")

  const [settings, service, appointments, blockedSlots, recurringBlocks] = await Promise.all([
    prisma.barberSettings.findUnique({ where: { userId: barberId } }),
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.appointment.findMany({
      where: {
        date: { gte: rangeStart, lte: rangeEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
        barberId,
      },
      include: { service: true },
    }),
    prisma.blockedSlot.findMany({
      where: { barberId, date: { gte: startDate, lte: endDate } },
    }),
    prisma.recurringBlock.findMany({ where: { barberId } }),
  ])

  if (!settings || !service) {
    return NextResponse.json({ error: "Settings or service not found" }, { status: 404 })
  }

  const daysOff = settings.daysOff.split(",").filter(Boolean).map(Number)

  // Colombia current time (UTC-5, no DST)
  const nowColombia = new Date(Date.now() - 5 * 60 * 60 * 1000)
  const todayColombia = `${nowColombia.getUTCFullYear()}-${String(nowColombia.getUTCMonth() + 1).padStart(2, "0")}-${String(nowColombia.getUTCDate()).padStart(2, "0")}`
  const currentMinutes = nowColombia.getUTCHours() * 60 + nowColombia.getUTCMinutes()

  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number)
    return h * 60 + m
  }

  const result: Record<string, DayStatus> = {}

  // Iterate each day in range
  const cursor = new Date(startDate + "T12:00:00Z")
  const end = new Date(endDate + "T12:00:00Z")

  while (cursor <= end) {
    const dateStr = cursor.toISOString().slice(0, 10)
    const dayStart = parseColombia(dateStr + "T00:00:00")
    const dayOfWeek = getColombiaDayOfWeek(dayStart)

    // Day off in barber settings
    if (daysOff.includes(dayOfWeek)) {
      result[dateStr] = "off"
      cursor.setDate(cursor.getDate() + 1)
      continue
    }

    // All-day block
    const dayBlocks = blockedSlots.filter((b) => b.date === dateStr)
    if (dayBlocks.some((b) => b.allDay)) {
      result[dateStr] = "off"
      cursor.setDate(cursor.getDate() + 1)
      continue
    }

    // Resolve effective open/close for this day
    let effectiveOpen = settings.openTime
    let effectiveClose = settings.closeTime
    if (settings.daySchedules) {
      try {
        const daySchedules = JSON.parse(settings.daySchedules) as Record<string, { open: string; close: string }>
        const key = String(dayOfWeek)
        if (daySchedules[key]) {
          effectiveOpen = daySchedules[key].open
          effectiveClose = daySchedules[key].close
        }
      } catch {}
    }

    const startMinutes = toMin(effectiveOpen)
    const endMinutes = toMin(effectiveClose)
    const isToday = dateStr === todayColombia

    // Appointments for this specific day
    const dayAppointments = appointments.filter((apt) => {
      const d = parseColombia(dateStr + "T00:00:00")
      const dEnd = parseColombia(dateStr + "T23:59:59")
      return new Date(apt.date) >= d && new Date(apt.date) <= dEnd
    })

    let availableCount = 0

    for (let m = startMinutes; m + service.duration <= endMinutes; m += SLOT_INTERVAL) {
      const slotStart = m
      const slotEnd = m + service.duration

      if (isToday && slotStart < currentMinutes) continue

      const isBooked = dayAppointments.some((apt) => {
        const t = getColombiaTime(new Date(apt.date))
        const aptStart = t.hours * 60 + t.minutes
        const aptEnd = aptStart + apt.service.duration
        return slotStart < aptEnd && slotEnd > aptStart
      })
      if (isBooked) continue

      const isBlocked =
        dayBlocks.some((b) => {
          if (b.allDay) return true
          const bs = toMin(b.startTime)
          const be = toMin(b.endTime)
          return slotStart < be && slotEnd > bs
        }) ||
        recurringBlocks.some((r) => {
          if (r.daysOfWeek) {
            const days = r.daysOfWeek.split(",").map(Number)
            if (!days.includes(dayOfWeek)) return false
          }
          if (r.allDay) return true
          const bs = toMin(r.startTime)
          const be = toMin(r.endTime)
          return slotStart < be && slotEnd > bs
        })
      if (isBlocked) continue

      availableCount++
    }

    if (availableCount === 0) result[dateStr] = "full"
    else if (availableCount <= PARTIAL_THRESHOLD) result[dateStr] = "partial"
    else result[dateStr] = "available"

    cursor.setDate(cursor.getDate() + 1)
  }

  return NextResponse.json(result)
}
