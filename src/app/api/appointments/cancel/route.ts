import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendWhatsAppMessage } from "@/lib/twilio"
import { formatDate, formatTime } from "@/lib/utils"

export async function POST(req: NextRequest) {
  const { token } = await req.json()

  if (!token) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 })
  }

  const appointment = await prisma.appointment.findUnique({
    where: { token },
    include: { service: true, user: true },
  })

  if (!appointment) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 })
  }

  if (!["PENDING", "CONFIRMED"].includes(appointment.status)) {
    return NextResponse.json(
      { error: "Esta cita no se puede cancelar" },
      { status: 400 }
    )
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "CANCELLED" },
    include: { service: true, user: true },
  })

  // Notify barbers about the cancellation
  try {
    const barbers = await prisma.user.findMany({
      where: { role: "BARBER", phone: { not: null } },
      select: { phone: true },
    })

    const clientName = updated.user.name || "Cliente"
    const msg = `❌ *Cita Cancelada*\n\n👤 Cliente: ${clientName}\n📋 Servicio: ${updated.service.name}\n📅 Fecha: ${formatDate(updated.date)}\n🕐 Hora: ${formatTime(updated.date)}\n\nEl cliente canceló su cita.`

    for (const barber of barbers) {
      if (barber.phone) {
        sendWhatsAppMessage(barber.phone, msg).catch((err) =>
          console.error("Error notifying barber about cancellation:", err)
        )
      }
    }
  } catch (error) {
    console.error("Error notifying barbers:", error)
  }

  return NextResponse.json({ success: true })
}
