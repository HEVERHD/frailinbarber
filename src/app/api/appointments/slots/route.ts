import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseColombia, getColombiaTime, getColombiaDayOfWeek } from "@/lib/utils"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get("date")
  const serviceId = searchParams.get("serviceId")
  const barberId = searchParams.get("barberId")

  if (!dateStr || !serviceId || !barberId) {
    return NextResponse.json({ error: "date, serviceId and barberId required" }, { status: 400 })
  }

  const dayStart = parseColombia(dateStr + "T00:00:00")
  const dayEnd = parseColombia(dateStr + "T23:59:59")

  const [settings, service, appointments, blockedSlots] = await Promise.all([
    prisma.barberSettings.findUnique({ where: { userId: barberId } }),
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.appointment.findMany({
      where: {
        date: { gte: dayStart, lt: dayEnd },
        status: { in: ["PENDING", "CONFIRMED"] },
        barberId,
      },
      include: { service: true },
    }),
    prisma.blockedSlot.findMany({
      where: { date: dateStr, barberId },
    }),
  ])

  if (!settings || !service) {
    return NextResponse.json({ error: "Settings or service not found" }, { status: 404 })
  }

  // Check if it's a day off (use Colombia timezone for day of week)
  const daysOff = settings.daysOff.split(",").filter(Boolean).map(Number)
  if (daysOff.includes(getColombiaDayOfWeek(dayStart))) {
    return NextResponse.json({ slots: [], dayOff: true })
  }

  // Check if entire day is blocked
  const dayBlocked = blockedSlots.some((b) => b.allDay)
  if (dayBlocked) {
    return NextResponse.json({ slots: [], dayOff: false, blocked: true })
  }

  // Generate time slots
  const [openH, openM] = settings.openTime.split(":").map(Number)
  const [closeH, closeM] = settings.closeTime.split(":").map(Number)
  const startMinutes = openH * 60 + openM
  const endMinutes = closeH * 60 + closeM

  const slots: { time: string; available: boolean }[] = []

  // Compute current Colombia time (UTC-5, no DST) to mark past slots as unavailable
  const nowColombia = new Date(Date.now() - 5 * 60 * 60 * 1000)
  const todayColombia = `${nowColombia.getUTCFullYear()}-${String(nowColombia.getUTCMonth() + 1).padStart(2, "0")}-${String(nowColombia.getUTCDate()).padStart(2, "0")}`
  const isToday = dateStr === todayColombia
  const currentMinutes = nowColombia.getUTCHours() * 60 + nowColombia.getUTCMinutes()

  const SLOT_INTERVAL = 15 // fixed 15-minute intervals
  for (let m = startMinutes; m + service.duration <= endMinutes; m += SLOT_INTERVAL) {
    const hour = Math.floor(m / 60)
    const min = m % 60
    const timeStr = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`

    // Check if slot overlaps with existing appointments (using Colombia time)
    const slotStart = hour * 60 + min
    const slotEnd = slotStart + service.duration

    const isBooked = appointments.some((apt) => {
      const aptTime = getColombiaTime(new Date(apt.date))
      const aptStart = aptTime.hours * 60 + aptTime.minutes
      const aptEnd = aptStart + apt.service.duration
      return slotStart < aptEnd && slotEnd > aptStart
    })

    // Check if slot is blocked
    const isBlocked = blockedSlots.some((blocked) => {
      if (blocked.allDay) return true
      return timeStr >= blocked.startTime && timeStr < blocked.endTime
    })

    // Mark past slots as unavailable when viewing today
    const isPast = isToday && slotStart < currentMinutes

    slots.push({ time: timeStr, available: !isBooked && !isBlocked && !isPast })
  }

  return NextResponse.json({ slots, dayOff: false })
}
