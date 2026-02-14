import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateTimeSlots } from "@/lib/utils"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get("date")
  const serviceId = searchParams.get("serviceId")

  if (!dateStr || !serviceId) {
    return NextResponse.json({ error: "date and serviceId required" }, { status: 400 })
  }

  const date = new Date(dateStr + "T00:00:00")
  const nextDay = new Date(dateStr + "T23:59:59")

  const [settings, service, appointments] = await Promise.all([
    prisma.barberSettings.findFirst(),
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.appointment.findMany({
      where: {
        date: { gte: date, lt: nextDay },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
  ])

  if (!settings || !service) {
    return NextResponse.json({ error: "Settings or service not found" }, { status: 404 })
  }

  // Check if it's a day off
  const daysOff = settings.daysOff.split(",").map(Number)
  if (daysOff.includes(date.getDay())) {
    return NextResponse.json({ slots: [], dayOff: true })
  }

  const bookedSlots = appointments.map((a) => a.date)
  const slots = generateTimeSlots(
    settings.openTime,
    settings.closeTime,
    service.duration,
    bookedSlots,
    date
  )

  return NextResponse.json({ slots, dayOff: false })
}
