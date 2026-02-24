import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { parseColombia, getColombiaDateStr } from "@/lib/utils"

export const dynamic = "force-dynamic"

function maskName(name: string | null): string {
  if (!name) return "Cliente"
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[1][0]}.`
}

export async function GET() {
  const today = getColombiaDateStr(new Date())

  const appointments = await prisma.appointment.findMany({
    where: {
      date: {
        gte: parseColombia(today + "T00:00:00"),
        lt: parseColombia(today + "T23:59:59"),
      },
      status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
    },
    include: {
      user: { select: { name: true } },
      service: { select: { name: true, duration: true } },
      barber: { select: { name: true, barberSettings: { select: { shopName: true } } } },
    },
    orderBy: { date: "asc" },
  })

  const shopName = appointments[0]?.barber?.barberSettings?.shopName || "Frailin Studio"

  return NextResponse.json(
    {
      shopName,
      appointments: appointments.map((apt) => ({
        id: apt.id,
        clientName: maskName(apt.user.name),
        serviceName: apt.service.name,
        duration: apt.service.duration,
        date: apt.date,
        status: apt.status,
      })),
      updatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    }
  )
}
