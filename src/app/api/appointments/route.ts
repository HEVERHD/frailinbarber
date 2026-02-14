import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendWhatsAppMessage, buildConfirmationMessage } from "@/lib/twilio"
import { formatDate, formatTime } from "@/lib/utils"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get("date")
  const status = searchParams.get("status")

  const where: any = {}

  if (dateStr) {
    // Parse as local date (noon to avoid timezone shifts)
    const date = new Date(dateStr + "T00:00:00")
    const nextDay = new Date(dateStr + "T23:59:59")
    where.date = { gte: date, lt: nextDay }
  }

  if (status) {
    where.status = status
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { user: true, service: true },
    orderBy: { date: "asc" },
  })

  return NextResponse.json(appointments)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Find or create client user
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: body.phone },
        ...(body.email ? [{ email: body.email }] : []),
      ],
    },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: body.clientName,
        phone: body.phone,
        email: body.email || null,
        role: "CLIENT",
      },
    })
  } else {
    // Update phone if missing
    if (!user.phone && body.phone) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { phone: body.phone },
      })
    }
  }

  const appointment = await prisma.appointment.create({
    data: {
      date: new Date(body.date),
      userId: user.id,
      serviceId: body.serviceId,
      bookedBy: body.bookedBy || "CLIENT",
      notes: body.notes || null,
      status: "CONFIRMED",
    },
    include: { service: true, user: true },
  })

  // Send WhatsApp confirmation
  if (user.phone) {
    const settings = await prisma.barberSettings.findFirst()
    try {
      const message = buildConfirmationMessage(
        user.name || "Cliente",
        appointment.service.name,
        formatDate(appointment.date),
        formatTime(appointment.date),
        settings?.shopName || "Mi Barbería"
      )
      await sendWhatsAppMessage(user.phone, message)
    } catch (error) {
      console.error("Error sending WhatsApp:", error)
    }
  }

  return NextResponse.json(appointment, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const appointment = await prisma.appointment.update({
    where: { id: body.id },
    data: { status: body.status },
    include: { service: true, user: true },
  })

  return NextResponse.json(appointment)
}
