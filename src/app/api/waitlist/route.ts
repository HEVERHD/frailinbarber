import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendWhatsAppTemplate } from "@/lib/twilio"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date")
  const status = searchParams.get("status")

  const where: any = {}
  if (date) where.date = date
  if (status) where.status = status

  const entries = await prisma.waitlistEntry.findMany({
    where,
    include: { service: true },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(entries)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { date, name, phone, serviceId } = body

  if (!date || !name || !phone || !serviceId) {
    return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
  }

  // Check if already on waitlist for this date+phone
  const existing = await prisma.waitlistEntry.findFirst({
    where: { date, phone, status: "WAITING" },
  })

  if (existing) {
    return NextResponse.json({ error: "Ya estás en la lista de espera para este día" }, { status: 409 })
  }

  const entry = await prisma.waitlistEntry.create({
    data: { date, name, phone, serviceId },
    include: { service: true },
  })

  return NextResponse.json(entry, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const { id, status } = body

  if (!id || !status) {
    return NextResponse.json({ error: "ID y status requeridos" }, { status: 400 })
  }

  const entry = await prisma.waitlistEntry.update({
    where: { id },
    data: { status, notified: status === "NOTIFIED" ? true : undefined },
    include: { service: true },
  })

  // Send WhatsApp template when manually notifying a waiting client
  if (status === "NOTIFIED" && entry.phone) {
    const templateSid = process.env.TWILIO_TEMPLATE_WAITLIST
    if (templateSid) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || ""
      const bookingUrl = baseUrl ? `${baseUrl}/booking` : "frailinstudio.com/booking"
      const [y, m, d] = entry.date.split("-")
      const dateLabel = new Date(+y, +m - 1, +d).toLocaleDateString("es-CO", {
        weekday: "long", day: "numeric", month: "long",
      })
      sendWhatsAppTemplate(entry.phone, templateSid, {
        "1": entry.name,
        "2": dateLabel,
        "3": entry.service.name,
        "4": bookingUrl,
      }).catch((err: unknown) =>
        console.error("[Waitlist] Error sending WhatsApp template on notify:", err)
      )
    }
  }

  return NextResponse.json(entry)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

  await prisma.waitlistEntry.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
