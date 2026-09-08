import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendWhatsAppMessage, sendWhatsAppTemplateWithSMSFallback } from "@/lib/twilio"
import { formatDate, formatTime } from "@/lib/utils"
import { sendPushToBarber } from "@/lib/push"
import { autoScheduleFromWaitlist } from "@/lib/waitlist"
import { cancelAppointmentSchema } from "@/lib/validation"

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null)
  const parsed = cancelAppointmentSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 })
  }
  const { token } = parsed.data

  const appointment = await prisma.appointment.findUnique({
    where: { token },
    include: {
      service: true,
      user: true,
      barber: { select: { id: true, phone: true, barberSettings: { select: { phone: true } } } },
    },
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

  // Notify only the barber assigned to this appointment
  try {
    const barberPhone = appointment.barber.barberSettings?.phone || appointment.barber.phone

    if (barberPhone) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || ""
      const agendaLink = baseUrl ? `${baseUrl}/dashboard` : ""
      const clientName = updated.user.name || "Cliente"
      const cancelTemplateSid = process.env.TWILIO_TEMPLATE_CANCEL
      const freeFormMsg = `❌ *Cita Cancelada*\n\n👤 Cliente: ${clientName}\n📋 Servicio: ${updated.service.name}\n📅 Fecha: ${formatDate(updated.date)}\n🕐 Hora: ${formatTime(updated.date)}\n\nEl cliente canceló su cita.${agendaLink ? `\n\n📅 Ver agenda: ${agendaLink}` : ""}`

      if (cancelTemplateSid) {
        sendWhatsAppTemplateWithSMSFallback(barberPhone, cancelTemplateSid, {
          "1": clientName,
          "2": updated.service.name,
          "3": formatDate(updated.date),
          "4": formatTime(updated.date),
          "5": agendaLink,
        }, `Cita cancelada.\n\nCliente: ${clientName}\nServicio: ${updated.service.name}\nFecha: ${formatDate(updated.date)}\nHora: ${formatTime(updated.date)}${agendaLink ? `\n\nVer agenda: ${agendaLink}` : ""}`).catch((err) =>
          console.error("Error notifying barber about cancellation:", err)
        )
      } else {
        sendWhatsAppMessage(barberPhone, freeFormMsg).catch((err) =>
          console.error("Error notifying barber about cancellation:", err)
        )
      }
    }
  } catch (error) {
    console.error("Error notifying barber:", error)
  }

  // Push notification to the assigned barber
  sendPushToBarber(appointment.barber.id, {
    title: "❌ Cita cancelada",
    body: `${updated.user.name || "Cliente"} canceló · ${updated.service.name} · ${formatDate(updated.date)} ${formatTime(updated.date)}`,
    url: "/appointments",
    tag: "cancelled-appointment",
  }).catch(() => {})

  // Auto-schedule the next person waiting in the waitlist
  autoScheduleFromWaitlist(appointment.date, appointment.barber.id, appointment.serviceId).catch((err) =>
    console.error("[Cancel] Error auto-scheduling from waitlist:", err)
  )

  return NextResponse.json({ success: true })
}
