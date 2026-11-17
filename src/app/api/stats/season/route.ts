import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getColombiaDateStr, parseColombia } from "@/lib/utils"
import { countBookableSlots } from "@/lib/availability"

export const dynamic = "force-dynamic"

// Resumen de temporada: citas AGENDADAS (no solo completadas) del mes contra el
// anterior, horas pico, servicio estrella y ocupación del 24 y 31 de diciembre.
export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  const userId = (session?.user as any)?.id
  if (!session || (role !== "BARBER" && role !== "ADMIN")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  // Identity from the session: a barber only ever sees their own appointments
  const barberFilter = role === "ADMIN" ? {} : { barberId: userId as string }

  const now = new Date()
  const today = getColombiaDateStr(now)
  const [y, m] = today.split("-").map(Number)
  const ym = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}`
  const prev = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 }
  const next = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 }
  const monthStart = parseColombia(`${ym(y, m)}-01T00:00:00`)
  const prevStart = parseColombia(`${ym(prev.y, prev.m)}-01T00:00:00`)
  const nextStart = parseColombia(`${ym(next.y, next.m)}-01T00:00:00`)

  const notCancelled = { status: { notIn: ["CANCELLED" as const] } }

  const [monthAppointments, prevCount] = await Promise.all([
    prisma.appointment.findMany({
      where: { date: { gte: monthStart, lt: nextStart }, ...notCancelled, ...barberFilter },
      select: { date: true, service: { select: { name: true } } },
    }),
    prisma.appointment.count({
      where: { date: { gte: prevStart, lt: monthStart }, ...notCancelled, ...barberFilter },
    }),
  ])

  const monthCount = monthAppointments.length
  const trend = prevCount > 0 ? Math.round(((monthCount - prevCount) / prevCount) * 100) : null

  // Horas pico (hora Colombia)
  const hourCounts = new Map<number, number>()
  const serviceCounts = new Map<string, number>()
  for (const a of monthAppointments) {
    const h = new Date(a.date.getTime() - 5 * 60 * 60 * 1000).getUTCHours()
    hourCounts.set(h, (hourCounts.get(h) ?? 0) + 1)
    serviceCounts.set(a.service.name, (serviceCounts.get(a.service.name) ?? 0) + 1)
  }
  const peakHours = Array.from(hourCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour, count]) => ({
      label: hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`,
      count,
    }))
  const star = Array.from(serviceCounts.entries()).sort((a, b) => b[1] - a[1])[0]
  const starService = star ? { name: star[0], count: star[1] } : null

  // Días fuertes: 24 y 31 de diciembre — agendadas y cupos que quedan
  const hotYear = m === 1 ? y - 1 : y
  const hotDates = [`${hotYear}-12-24`, `${hotYear}-12-31`]
  const barbers = await prisma.user.findMany({
    where: { role: "BARBER", barberSettings: { isNot: null }, ...(role === "ADMIN" ? {} : { id: userId }) },
    select: {
      barberSettings: true,
      barberAppointments: {
        where: {
          date: { gte: parseColombia(hotDates[0] + "T00:00:00"), lte: parseColombia(hotDates[1] + "T23:59:59") },
          status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
        },
        select: { date: true, service: { select: { duration: true } } },
      },
      blockedSlots: { where: { date: { in: hotDates } } },
      recurringBlocks: true,
    },
  })
  const hotDays = hotDates.map((date) => {
    const dayStart = parseColombia(date + "T00:00:00")
    const dayEnd = parseColombia(date + "T23:59:59")
    let booked = 0
    let free = 0
    for (const b of barbers) {
      booked += b.barberAppointments.filter((a) => a.date >= dayStart && a.date <= dayEnd).length
      const s = b.barberSettings!
      free += countBookableSlots(date, s.slotDuration, s, b.barberAppointments, b.blockedSlots, b.recurringBlocks, now)
    }
    return { date, booked, free, past: date < today }
  })

  return NextResponse.json({
    monthLabel: monthStart.toLocaleDateString("es-CO", { month: "long", timeZone: "America/Bogota" }),
    prevMonthLabel: prevStart.toLocaleDateString("es-CO", { month: "long", timeZone: "America/Bogota" }),
    monthCount,
    prevCount,
    trend,
    peakHours,
    starService,
    hotDays,
  })
}
