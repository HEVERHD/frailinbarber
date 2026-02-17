import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 })
  }

  const appointment = await prisma.appointment.findUnique({
    where: { token },
    include: {
      service: { select: { name: true, duration: true, price: true } },
      user: { select: { name: true } },
      barber: { select: { name: true } },
    },
  })

  if (!appointment) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
  }

  const settings = await prisma.barberSettings.findUnique({
    where: { userId: appointment.barberId },
  })

  return NextResponse.json({
    id: appointment.id,
    date: appointment.date.toISOString(),
    status: appointment.status,
    service: appointment.service,
    user: appointment.user,
    barber: appointment.barber,
    shopName: settings?.shopName || "Frailin Studio",
  })
}
